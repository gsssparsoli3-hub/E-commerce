import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../utils.dart';

/// Login form used on the auth screen. Calls [onSuccess] after a successful
/// sign-in so the host page can navigate.
class LoginForm extends StatefulWidget {
  const LoginForm({super.key, required this.onSuccess});

  final VoidCallback onSuccess;

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;
  bool _busy = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _busy) return;
    setState(() => _busy = true);
    try {
      await context.read<AuthProvider>().login(
            _emailController.text.trim(),
            _passwordController.text,
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
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              decoration: _deco('Email', Icons.email_outlined),
              validator: _validateEmail,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _passwordController,
              obscureText: _obscure,
              onFieldSubmitted: (_) => _submit(),
              decoration: _deco('Password', Icons.lock_outline).copyWith(
                suffixIcon: IconButton(
                  onPressed: () => setState(() => _obscure = !_obscure),
                  icon: Icon(
                    _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  ),
                ),
              ),
              validator: (value) =>
                  (value ?? '').isEmpty ? 'Please enter your password' : null,
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
                  : const Text('Login'),
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
