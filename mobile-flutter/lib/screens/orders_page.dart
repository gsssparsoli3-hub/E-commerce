import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/order.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../utils.dart';
import '../widgets/empty_state.dart';
import '../widgets/order_card.dart';
import 'auth_page.dart';

/// Order history: pull-to-refresh list of expandable order cards with
/// cancel support for PLACED/CONFIRMED orders.
class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});

  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  List<Order> _orders = [];
  bool _loading = true;
  String? _error;

  ApiService get _api => context.read<AuthProvider>().api;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final orders = await _api.fetchOrders();
      if (!mounted) return;
      setState(() {
        _orders = orders;
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

  Future<void> _confirmCancel(Order order) async {
    final confirmed = await confirmDialog(
      context,
      title: 'Cancel this order?',
      message:
          'Order #${order.orderNumber} will be cancelled and the items '
          'returned to stock. This cannot be undone.',
      confirmLabel: 'Cancel order',
      cancelLabel: 'Keep it',
      destructive: true,
    );
    if (!confirmed) return;
    try {
      await _api.cancelOrder(order.id);
      if (!mounted) return;
      showSnack(context, 'Order #${order.orderNumber} was cancelled.');
      _load();
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authed = context.watch<AuthProvider>().isAuthed;
    Widget body;
    if (!authed) {
      body = EmptyState(
        icon: Icons.lock_outline,
        title: 'Sign in to view your orders',
        actionLabel: 'Sign in',
        onAction: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const AuthPage()),
        ),
      );
    } else if (_loading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_error != null) {
      body = EmptyState(
        icon: Icons.cloud_off,
        title: 'Could not load your orders',
        message: _error,
        actionLabel: 'Retry',
        onAction: _load,
      );
    } else if (_orders.isEmpty) {
      body = EmptyState(
        icon: Icons.receipt_long_outlined,
        title: 'No orders yet',
        message: 'Your placed orders will show up here.',
        actionLabel: 'Start shopping',
        onAction: () => Navigator.of(context).pop(),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: _load,
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _orders.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) => OrderCard(
            order: _orders[index],
            onCancel: _confirmCancel,
          ),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('My Orders')),
      body: body,
    );
  }
}
