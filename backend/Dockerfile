FROM php:8.3-apache

RUN apt-get update && apt-get install -y \
    libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install pdo pdo_mysql zip gd bcmath \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction

COPY . .
RUN composer dump-autoload --optimize \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Enlace public/storage -> storage/app/public, el que crea `artisan storage:link`.
# Se hace aquí a propósito: public/ vive en la capa de la imagen, así que un enlace
# creado en caliente desaparece al recrear el contenedor y las imágenes dejan de
# servirse. Horneado en la imagen sobrevive a cualquier recreación.
RUN ln -sfn ../storage/app/public public/storage

# Apuntar Apache a public/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

EXPOSE 80
