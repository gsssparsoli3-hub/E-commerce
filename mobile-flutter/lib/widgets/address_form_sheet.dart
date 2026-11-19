import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/address.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

/// Modal bottom sheet with the "new address" form. Calls [onSaved] with the
/// created address and pops itself.
class AddressFormSheet extends StatefulWidget {
  const AddressFormSheet({super.key, required this.onSaved});

  final ValueChanged<Address> onSaved;

  @override
  State<AddressFormSheet> createState() => _AddressFormSheetState();
}

class _AddressFormSheetState extends State<AddressFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _phone = TextEditingController();
  final _line1 = TextEditingController();
  final _line2 = TextEditingController();
  final _city = TextEditingController();
  final _state = TextEditingController();
  final _pincode = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _fullName.dispose();
    _phone.dispose();
    _line1.dispose();
    _line2.dispose();
    _city.dispose();
    _state.dispose();
    _pincode.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate() || _saving) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final address = await context.read<AuthProvider>().api.addAddress(
            fullName: _fullName.text.trim(),
            phone: _phone.text.trim(),
            line1: _line1.text.trim(),
            line2: _line2.text.trim(),
            city: _city.text.trim(),
            state: _state.text.trim(),
            pincode: _pincode.text.trim(),
          );
      if (!mounted) return;
      widget.onSaved(address);
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'New Address',
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _field(_fullName, 'Full name', Icons.person_outline),
              _field(_phone, 'Phone number', Icons.phone_outlined,
                  type: TextInputType.phone, validator: _validatePhone),
              _field(_line1, 'Address line 1 (house, street)', Icons.home_outlined),
              _field(_line2, 'Address line 2 (optional)', Icons.apartment),
              Row(
                children: [
                  Expanded(child: _field(_city, 'City', Icons.location_city)),
                  const SizedBox(width: 12),
                  Expanded(child: _field(_state, 'State', Icons.map_outlined)),
                ],
              ),
              _field(_pincode, 'Pincode', Icons.markunread_mailbox_outlined,
                  type: TextInputType.number, validator: _validatePincode),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    _error!,
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Save address'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label,
    IconData icon, {
    TextInputType type = TextInputType.text,
    String? Function(String?)? validator,
  }) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextFormField(
          controller: controller,
          keyboardType: type,
          textInputAction: TextInputAction.next,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(
            labelText: label,
            prefixIcon: Icon(icon),
            isDense: true,
            border: const OutlineInputBorder(),
          ),
          validator: validator ?? _required,
        ),
      );

  String? _required(String? value) =>
      (value ?? '').trim().isEmpty ? 'This field is required' : null;

  String? _validatePhone(String? value) {
    final phone = value?.trim() ?? '';
    if (!RegExp(r'^\d{10,15}$').hasMatch(phone)) {
      return 'Enter a valid phone number (10-15 digits)';
    }
    return null;
  }

  String? _validatePincode(String? value) {
    if (!RegExp(r'^\d{6}$').hasMatch(value?.trim() ?? '')) {
      return 'Enter a valid 6-digit pincode';
    }
    return null;
  }
}
