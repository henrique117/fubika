#!/bin/bash

echo "🛡️  Configurando bases de dados e permissões (Shadow DB + Prisma Fix)..."

mysql -u root -p"${DB_ROOT_PASS}" <<-EOSQL
    -- 1. Criar a base de dados principal
    CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;

    -- 2. Criar a base de dados de sombra (Shadow DB) para o Prisma Migrate
    -- Essencial para evitar o erro P3014
    CREATE DATABASE IF NOT EXISTS \`${DB_NAME}_shadow\`;

    -- 3. Criar o utilizador da aplicação se não existir
    CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASS}';
    
    -- 4. Garantir que a senha está sincronizada com o .env
    ALTER USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASS}';

    -- 5. PERMISSÕES NA BASE PRINCIPAL (${DB_NAME})
    -- Adicionado 'DROP' para permitir que o 'db push' funcione quando houver mudanças estruturais
    GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER, REFERENCES, DROP 
    ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';

    -- 6. PERMISSÕES TOTAIS NA BASE DE SOMBRA (${DB_NAME}_shadow)
    -- O Prisma precisa de controlo total aqui para criar/apagar tabelas temporárias
    GRANT ALL PRIVILEGES ON \`${DB_NAME}_shadow\`.* TO '${DB_USER}'@'%';

    -- 7. Garantir acesso administrativo total ao root via rede
    GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

    FLUSH PRIVILEGES;
EOSQL

echo "✅ Configuração concluída com sucesso!"
echo "   - DB Principal: ${DB_NAME}"
echo "   - Shadow DB: ${DB_NAME}_shadow"
echo "   - Utilizador: ${DB_USER}"