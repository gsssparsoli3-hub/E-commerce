import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/order.dart';
import '../services/api_service.dart';
import 'app_image.dart';
import 'money_row.dart';
import 'order_status_chip.dart';
import 'price_text.dart';

/// Expandable order card: status chip and summary in the header; items,
/// money breakdown, delivery address and cancel button when expanded.
class OrderCard extends StatelessWidget {
  const OrderCard({super.key, required this.order, required this.onCancel});

  final Order order;
  final ValueChanged<Order> onCancel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      child: Theme(
        data: theme.copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
          title: Text(
            'Order #${order.orderNumber}',
            style: theme.textTheme.titleSmall
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 6),
              Row(
                children: [
                  OrderStatusChip(status: order.status),
                  const SizedBox(width: 8),
                  Text(
                    order.paymentMethod == 'COD'
                        ? 'Cash on Delivery'
                        : 'Razorpay',
                    style: theme.textTheme.labelSmall
                        ?.copyWith(color: theme.hintColor),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '${order.items.length} item(s) · '
                '${ApiService.formatINR(order.total)} · ${order.paymentStatus}',
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: 2),
              Text(
                DateFormat('d MMM yyyy, h:mm a').format(order.createdAt),
                style: theme.textTheme.labelSmall
                    ?.copyWith(color: theme.hintColor),
              ),
            ],
          ),
          children: [
            for (final item in order.items) _itemTile(context, item),
            const Divider(height: 24),
            MoneyRow(
                label: 'Subtotal', value: ApiService.formatINR(order.subtotal)),
            if (order.discount > 0)
              MoneyRow(
                label: 'Discount'
                    '${order.couponCode != null ? ' (${order.couponCode})' : ''}',
                value: '-${ApiService.formatINR(order.discount)}',
                credit: true,
              ),
            MoneyRow(
              label: 'Shipping',
              value: order.shipping == 0
                  ? 'FREE'
                  : ApiService.formatINR(order.shipping),
              credit: order.shipping == 0,
            ),
            MoneyRow(
              label: 'Total',
              value: ApiService.formatINR(order.total),
              emphasized: true,
            ),
            if (order.address != null) ...[
              const SizedBox(height: 8),
              Text(
                'Deliver to',
                style: theme.textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: theme.hintColor,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${order.address!.fullName} · ${order.address!.phone}',
                style: theme.textTheme.bodySmall,
              ),
              Text(
                order.address!.fullAddress,
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.hintColor),
              ),
            ],
            if (order.canCancel)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: OutlinedButton.icon(
                  onPressed: () => onCancel(order),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: theme.colorScheme.error,
                    side: BorderSide(color: theme.colorScheme.error),
                  ),
                  icon: const Icon(Icons.close, size: 18),
                  label: const Text('Cancel order'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _itemTile(BuildContext context, OrderItem item) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 46,
              height: 46,
              child: AppImage(url: item.image),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                Text(
                  'Qty: ${item.quantity}',
                  style: theme.textTheme.labelSmall
                      ?.copyWith(color: theme.hintColor),
                ),
              ],
            ),
          ),
          PriceText(
            paise: item.lineTotal,
            style: theme.textTheme.bodySmall
                ?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
