import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/address.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/settings_provider.dart';
import '../services/api_service.dart';
import '../utils.dart';
import '../widgets/address_form_sheet.dart';
import '../widgets/change_password_dialog.dart';
import '../widgets/edit_profile_dialog.dart';
import '../widgets/empty_state.dart';
import '../widgets/profile_card.dart';
import '../widgets/saved_addresses_card.dart';
import 'auth_page.dart';
import 'orders_page.dart';

/// Account tab: profile card, orders link, saved addresses (add/delete),
/// profile/password editors and sign out.
class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  List<Address> _addresses = [];
  bool _loadingAddresses = true;

  ApiService get _api => context.read<AuthProvider>().api;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAddresses());
  }

  Future<void> _loadAddresses() async {
    setState(() => _loadingAddresses = true);
    try {
      final addresses = await _api.fetchAddresses();
      if (!mounted) return;
      setState(() => _addresses = addresses);
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message);
    } finally {
      if (mounted) setState(() => _loadingAddresses = false);
    }
  }

  Future<void> _openAddressForm() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => AddressFormSheet(
        onSaved: (address) =>
            setState(() => _addresses = [..._addresses, address]),
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
      setState(() => _addresses = _addresses
          .where((element) => element.id != address.id)
          .toList());
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message);
    }
  }

  Future<void> _logout() async {
    final confirmed = await confirmDialog(
      context,
      title: 'Sign out?',
      message: 'You will need to sign in again to place orders.',
      confirmLabel: 'Sign out',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    context.read<CartProvider>().reset();
    context.read<AuthProvider>().logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const AuthPage()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final settings = context.watch<SettingsProvider>().settings;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Account')),
        body: EmptyState(
          icon: Icons.person_outline,
          title: 'You are signed out',
          message: 'Sign in to manage your profile, addresses and orders.',
          actionLabel: 'Sign in',
          onAction: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const AuthPage()),
          ),
        ),
      );
    }

    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('My Account')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ProfileCard(user: user),
          const SizedBox(height: 12),
          Card(
            margin: EdgeInsets.zero,
            child: ListTile(
              leading: Icon(Icons.receipt_long_outlined,
                  color: theme.colorScheme.primary),
              title: const Text('My Orders'),
              subtitle: const Text('View and track your orders'),
              trailing: const Icon(Icons.chevron_right, color: Colors.grey),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const OrdersPage()),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SavedAddressesCard(
            addresses: _addresses,
            loading: _loadingAddresses,
            onAdd: _openAddressForm,
            onDelete: _deleteAddress,
          ),
          const SizedBox(height: 12),
          Card(
            margin: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.edit_outlined),
                  title: const Text('Edit profile'),
                  trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                  onTap: () => showDialog<void>(
                    context: context,
                    builder: (_) => EditProfileDialog(user: user),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.password_outlined),
                  title: const Text('Change password'),
                  trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                  onTap: () => showDialog<void>(
                    context: context,
                    builder: (_) => const ChangePasswordDialog(),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: theme.colorScheme.error,
              side: BorderSide(color: theme.colorScheme.error),
            ),
            onPressed: _logout,
            icon: const Icon(Icons.logout),
            label: const Text('Sign out'),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              '${settings?.siteName ?? 'Shoperic'} · v1.0.0',
              style:
                  theme.textTheme.labelSmall?.copyWith(color: theme.hintColor),
            ),
          ),
        ],
      ),
    );
  }
}
