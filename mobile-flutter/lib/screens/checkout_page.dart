import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/address.dart';
import '../models/app_settings.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/settings_provider.dart';
import '../services/api_service.dart';
import '../utils.dart';
import '../widgets/address_form_sheet.dart';
import '../widgets/checkout_address_section.dart';
import '../widgets/empty_state.dart';
import '../widgets/order_success_dialog.dart';
import '../widgets/order_summary_card.dart';
import '../widgets/payment_options.dart';
import 'orders_page.dart';

/// Checkout: address selection (with add/delete), payment method, order
/// summary and Place Order. On success shows a dialog and moves to orders.
class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  List<Address> _addresses = [];
  Address? _selected;
  bool _loading = true;
  String? _error;
  String _paymentMethod = 'COD';
  bool _placing = false;

  ApiService get _api => context.read<AuthProvider>().api;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAddresses());
  }

  Future<void> _loadAddresses() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final addresses = await _api.fetchAddresses();
      if (!mounted) return;
      setState(() {
        _addresses = addresses;
        _selected = _pickSelected(addresses);
        _loading = false;
      });
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    }
  }

  Address? _pickSelected(List<Address> addresses) {
    for (final address in addresses) {
      if (address.isDefault) return address;
    }
    return addresses.isEmpty ? null : addresses.first;
  }

  /// Falls back to an available method when the chosen one is disabled.
  String _effectiveMethod(AppSettings? settings) {
    final codEnabled = settings?.codEnabled ?? true;
    final razorpayEnabled = settings?.razorpayEnabled ?? false;
    if (_paymentMethod == 'COD' && !codEnabled && razorpayEnabled) {
      return 'RAZORPAY';
    }
    return _paymentMethod;
  }

  Future<void> _openAddressForm() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => AddressFormSheet(
        onSaved: (address) => setState(() {
          _addresses = [..._addresses, address];
          _selected = address;
        }),
      ),
    );
  }

  Future<void> _deleteAddress(Address address) async {
    final confirmed = await confirmDialog(
      context,
      title: 'Delete address?',
      message: "Delete ${address.fullName}'s address (${address.city})?",
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!confirmed) return;
    try {
      await _api.deleteAddress(address.id);
      if (!mounted) return;
      setState(() {
        _addresses =
            _addresses.where((item) => item.id != address.id).toList();
        if (_selected?.id == address.id) _selected = _pickSelected(_addresses);
      });
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message);
    }
  }

  Future<void> _placeOrder() async {
    final address = _selected;
    if (address == null || _placing) return;
    final method =
        _effectiveMethod(context.read<SettingsProvider>().settings);
    final cart = context.read<CartProvider>();
    setState(() => _placing = true);
    try {
      final result = await _api.placeOrder(
        addressId: address.id,
        paymentMethod: method,
        couponCode: cart.couponCode,
      );
      await cart.refreshAfterOrder();
      if (!mounted) return;
      await showOrderSuccessDialog(context, result: result, method: method);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const OrdersPage()),
      );
    } on ApiException catch (e) {
      if (mounted) {
        setState(() => _placing = false);
        showSnack(context, e.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>().settings;
    final method = _effectiveMethod(settings);
    final cartEmpty = context.watch<CartProvider>().isEmpty;
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? EmptyState(
                  icon: Icons.cloud_off,
                  title: 'Could not load checkout',
                  message: _error,
                  actionLabel: 'Retry',
                  onAction: _loadAddresses,
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  children: [
                    CheckoutAddressSection(
                      addresses: _addresses,
                      selected: _selected,
                      onSelected: (address) =>
                          setState(() => _selected = address),
                      onAddPressed: _openAddressForm,
                      onDeletePressed: _deleteAddress,
                    ),
                    const SizedBox(height: 12),
                    PaymentOptions(
                      settings: settings,
                      method: method,
                      onChanged: (value) => setState(() => _paymentMethod = value),
                    ),
                    const SizedBox(height: 12),
                    OrderSummaryCard(settings: settings),
                    const SizedBox(height: 96),
                  ],
                ),
      bottomNavigationBar: (_loading || _error != null)
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: _placing
                    ? const Center(child: CircularProgressIndicator())
                    : FilledButton.icon(
                        onPressed: (_selected == null || cartEmpty)
                            ? null
                            : _placeOrder,
                        icon: const Icon(Icons.receipt_long_outlined),
                        label: Text(
                          _selected == null
                              ? 'Select a delivery address'
                              : 'Place Order',
                        ),
                      ),
              ),
            ),
    );
  }
}
