<?php
return [
    'storage_bytes' => (int) env('DIATAR_STORAGE_MB', 1024) * 1024 * 1024,
    'upload_kb' => (int) env('DIATAR_UPLOAD_MB', 50) * 1024,
    'libreoffice' => env('LIBREOFFICE_BINARY', 'soffice'),
    'frontend_url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost:4200')),
];
