<?php

namespace App\Packages\Security\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Regla de contraseña segura para el sistema clínico
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos 1 letra mayúscula (A-Z)
 * - Al menos 1 letra minúscula (a-z)
 * - Al menos 1 número (0-9)
 * - Al menos 1 carácter especial (@$!%*?&#^_{}-)
 */
class StrongPasswordRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $password = (string) $value;

        if (strlen($password) < 8) {
            $fail('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (!preg_match('/[A-Z]/', $password)) {
            $fail('La contraseña debe contener al menos una letra mayúscula.');
            return;
        }

        if (!preg_match('/[a-z]/', $password)) {
            $fail('La contraseña debe contener al menos una letra minúscula.');
            return;
        }

        if (!preg_match('/[0-9]/', $password)) {
            $fail('La contraseña debe contener al menos un número.');
            return;
        }

        if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?]/', $password)) {
            $fail('La contraseña debe contener al menos un carácter especial (ej. !@?$-_{}).');
            return;
        }
    }
}
