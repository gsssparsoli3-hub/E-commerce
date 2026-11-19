import 'package:flutter/material.dart';

/// Asks the user to confirm an action. Returns true when confirmed.
/// [destructive] renders the confirm button in the error color.
Future<bool> confirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
  String cancelLabel = 'Cancel',
  bool destructive = false,
}) async {
  final theme = Theme.of(context);
  final result = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: Text(cancelLabel),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(true),
          style: destructive
              ? FilledButton.styleFrom(backgroundColor: theme.colorScheme.error)
              : null,
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result == true;
}

/// Shows a lightweight floating snackbar with [message].
void showSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
}
