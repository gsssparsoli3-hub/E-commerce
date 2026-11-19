import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../utils.dart';

/// Registration form used on the auth screen. Calls [onSuccess] after the
/// account is created (and automatically signed in).
class RegisterForm extends StatefulWidget {
  const RegisterForm({super.key, required this.onSuccess});

  final VoidCallback onSuccess;

  @override
  State<RegisterForm> createState() => _RegisterFormState();
}

class _RegisterFormState extends State<RegisterForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscure = true;
  bool _busy = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _busy) return;
    setState(() => _busy = true);
    try {
      await context.read<AuthProvider>().register(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            password: _passwordController.text,
            phone: _phoneController.text.trim(),
          );
    } on ApiException catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        showSnack(context, e.message);
      }
      return;
    }
    if (mounted) widget.onSuccess();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _nameController,
              textCapitalization: TextCapitalization.words,
              textInputAction: TextInputAction.next,
              decoration: _deco('Full name', Icons.person_outline),
              validator: (value) => (value ?? '').trim().isEmpty
                  ? 'Please enter your name'
                  : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              decoration: _deco('Email', Icons.email_outlined),
              validator: _validateEmail,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              decoration: _deco('Phone (optional)', Icons.phone_outlined),
              validator: _validatePhone,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _passwordController,
              obscureText: _obscure,
              textInputAction: TextInputAction.next,
              decoration: _deco('Password', Icons.lock_outline).copyWith(
                suffixIcon: IconButton(
                  onPressed: () => setState(() => _obscure = !_obscure),
                  icon: Icon(_obscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined),
                ),
              ),
              validator: (value) => (value ?? '').length < 6
                  ? 'Password must be at least 6 characters'
                  : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _confirmController,
              obscureText: _obscure,
              onFieldSubmitted: (_) => _submit(),
              decoration: _deco('Confirm password', Icons.lock_outline),
              validator: (value) =>
                  value != _passwordController.text ? 'Passwords do not match' : null,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Create account'),
            ),
          ],
        ),
      ),
    );
  }
}

InputDecoration _deco(String label, IconData icon) => InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon),
      border: const OutlineInputBorder(),
    );

String? _validateEmail(String? value) {
  final email = value?.trim() ?? '';
  if (email.isEmpty) return 'Please enter your email';
  if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
    return 'Enter a valid email address';
  }
  return null;
}

String? _validatePhone(String? value) {
  final phone = value?.trim() ?? '';
  if (phone.isEmpty) return null;
  if (!RegExp(r'^\d{10,15}$').hasMatch(phone)) {
    return 'Enter a valid phone number (10-15 digits)';
  }
  return null;
}
