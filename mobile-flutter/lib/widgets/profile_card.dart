import 'package:flutter/material.dart';

import '../models/user.dart';

/// Account header card: avatar with initials, name, email and phone.
class ProfileCard extends StatelessWidget {
  const ProfileCard({super.key, required this.user});

  final User user;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final initials = user.name.trim().isEmpty
        ? 'U'
        : user.name
            .trim()
            .split(RegExp(r'\s+'))
            .take(2)
            .map((part) => part[0])
            .join()
            .toUpperCase();
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
              child: Text(
                initials,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    user.email,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.hintColor),
                  ),
                  if (user.phone != null && user.phone!.isNotEmpty)
                    Text(
                      user.phone!,
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.hintColor),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
