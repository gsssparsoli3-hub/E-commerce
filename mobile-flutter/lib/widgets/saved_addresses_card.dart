import 'package:flutter/material.dart';

import '../models/address.dart';

/// Card listing saved addresses with add/delete actions (account page).
class SavedAddressesCard extends StatelessWidget {
  const SavedAddressesCard({
    super.key,
    required this.addresses,
    required this.loading,
    required this.onAdd,
    required this.onDelete,
  });

  final List<Address> addresses;
  final bool loading;
  final VoidCallback onAdd;
  final ValueChanged<Address> onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.location_on_outlined,
                    color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Saved Addresses',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
                TextButton.icon(
                  onPressed: onAdd,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add'),
                ),
              ],
            ),
            if (loading)
              const Padding(
                padding: EdgeInsets.all(8),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (addresses.isEmpty)
              Text(
                'No saved addresses yet.',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.hintColor),
              )
            else
              for (final address in addresses)
                ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    address.fullName,
                    style: theme.textTheme.bodySmall
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    '${address.phone}\n${address.fullAddress}',
                    style: theme.textTheme.labelSmall,
                  ),
                  isThreeLine: true,
                  trailing: IconButton(
                    icon: Icon(Icons.delete_outline,
                        size: 20, color: theme.colorScheme.error),
                    tooltip: 'Delete address',
                    onPressed: () => onDelete(address),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}
