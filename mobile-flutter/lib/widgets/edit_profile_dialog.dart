import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

/// Dialog to edit the profile name and phone number.
class EditProfileDialog extends StatefulWidget {
  const EditProfileDialog({super.key, required this.user});

  final User user;

  @override
  State<EditProfileDialog> createState() => _EditProfileDialogState();
}

class _EditProfileDialogState extends State<EditProfileDialog> {
  late final _nameController = TextEditingController(text: widget.user.name);
  late final _phoneController =
      TextEditingController(text: widget.user.phone ?? '');
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Name cannot be empty.');
      return;
    }
    final phone = _phoneController.text.trim();
    if (phone.isNotEmpty && !RegExp(r'^\d{10,15}$').hasMatch(phone)) {
      setState(() => _error = 'Enter a valid phone number (10-15 digits).');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await context
          .read<AuthProvider>()
          .updateProfile(name: name, phone: phone);
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
      content: Text('Profile updated.'),
      behavior: SnackBarBehavior.floating,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit profile'),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _nameController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Full name',
                prefixIcon: Icon(Icons.person_outline),
                isDense: true,
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone number',
                prefixIcon: Icon(Icons.phone_outlined),
                isDense: true,
                border: OutlineInputBorder(),
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
          ],
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
              : const Text('Save'),
        ),
      ],
    );
  }
}
