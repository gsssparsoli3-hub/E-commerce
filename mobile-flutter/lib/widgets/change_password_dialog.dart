import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../services/api_service.dart';

/// Dialog to change the account password (current + new + confirm).
class ChangePasswordDialog extends StatefulWidget {
  const ChangePasswordDialog({super.key});

  @override
  State<ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends State<ChangePasswordDialog> {
  final _formKey = GlobalKey<FormState>();
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscure = true;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate() || _saving) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await context.read<AuthProvider>().changePassword(
            currentPassword: _currentController.text,
            newPassword: _newController.text,
          );
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _saving = false;
        });
      }
      return;
    }
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    Navigator.of(context).pop();
    messenger.showSnackBar(const SnackBar(
      content: Text('Password changed successfully.'),
      behavior: SnackBarBehavior.floating,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Change password'),
      content: SizedBox(
        width: double.maxFinite,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _field(
                controller: _currentController,
                label: 'Current password',
              ),
              const SizedBox(height: 12),
              _field(
                controller: _newController,
                label: 'New password',
                validator: (value) => (value ?? '').length < 6
                    ? 'Password must be at least 6 characters'
                    : null,
              ),
              const SizedBox(height: 12),
              _field(
                controller: _confirmController,
                label: 'Confirm new password',
                validator: (value) =>
                    value != _newController.text ? 'Passwords do not match' : null,
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    _error!,
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Update'),
        ),
      ],
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    String? Function(String?)? validator,
  }) =>
      TextFormField(
        controller: controller,
        obscureText: _obscure,
        validator: validator ??
            (value) =>
                (value ?? '').isEmpty ? 'This field is required' : null,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.lock_outline),
          isDense: true,
          border: const OutlineInputBorder(),
          suffixIcon: IconButton(
            onPressed: () => setState(() => _obscure = !_obscure),
            icon: Icon(_obscure
                ? Icons.visibility_outlined
                : Icons.visibility_off_outlined),
          ),
        ),
      );
}
