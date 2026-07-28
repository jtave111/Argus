# Migrations (Flyway)

O Flyway roda automaticamente no boot todos os arquivos `V<n>__<descrição>.sql` daqui.

## Suas migrations atuais precisam de conversão (goose → Flyway)

As migrations em `../../../../../sql/migrations/` estão no formato **goose**, que o
Flyway não entende. Pra trazê-las pra cá:

1. **Renomear** `00001_auth_init_users_and_orgs.sql` → `V1__auth_init_users_and_orgs.sql`
   (Flyway exige o prefixo `V<versão>__`).
2. **Remover os blocos de _down_**: apague de `-- +goose Down` até o fim do arquivo —
   o Flyway não usa rollback embutido no mesmo arquivo.
3. A linha `-- +goose Up` pode ficar (é só um comentário) ou ser apagada.

Faça isso com seu SQL — é a sua camada de dados.
