FROM php:8.3-fpm-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libzip-dev libonig-dev libreoffice-impress fonts-dejavu-core fonts-liberation unzip \
 && docker-php-ext-install pdo_mysql mbstring zip pcntl \
 && apt-get clean
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/html
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist
COPY --chown=www-data:www-data . .
RUN composer dump-autoload --no-dev --optimize \
 && mkdir -p storage/app/private storage/app/conversion storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache
COPY docker/php.ini /usr/local/etc/php/conf.d/diatar.ini
USER www-data
CMD ["php-fpm"]
