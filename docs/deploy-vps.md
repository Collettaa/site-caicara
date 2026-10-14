# Deploy na VPS com Swarm + Traefik

Este projeto deve ser publicado como stack do Docker Swarm. Nao use `docker compose up -d`
para producao, porque as `deploy.labels` do Traefik sao lidas no fluxo de stack/Swarm.

## Arquivos de referencia

- `docker-compose.yml`: stack canonica do site
- `stack.env.example`: nomes das variaveis obrigatorias da stack
- `.github/workflows/docker-publish.yml`: publica `ghcr.io/collettaa/site-caicara:latest` no push para `main`

## Estado atual

- stack ativa na VPS: `site-caicara`
- servico ativo na VPS: `site-caicara_web`
- dominio publicado: `caicara.store` e `www.caicara.store`
- rede externa usada pelo Traefik: `CaicaraNet`

## Fluxo recomendado

1. Fazer push na `main` e esperar a imagem nova ser publicada no GHCR.
2. Conferir se existe apenas uma stack dona do dominio:

```bash
docker stack ls
docker service ls
```

3. Localizar os servicos que anunciam `caicara.store`:

```bash
docker service inspect <servico> --format '{{json .Spec.Labels}}'
```

4. Remover stack antiga, servico temporario ou teste que estiver duplicando o dominio:

```bash
docker stack rm <stack-antiga>
docker service rm <servico-temporario>
```

5. Confirmar que Traefik e o site compartilham a rede externa `CaicaraNet`:

```bash
docker network ls
docker service inspect <servico-traefik>
docker service inspect site-caicara_web
```

6. No Portainer, atualizar a stack `site-caicara` com o `docker-compose.yml` deste repo.
7. Preencher as variaveis `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` e `GEMINI_API_KEY`
   na tela de environment variables da stack.
8. Redeployar a stack.

## Deploy por CLI

Se preferir publicar fora do Portainer:

```bash
docker stack deploy -c docker-compose.yml site-caicara
```

## GHCR

Hoje a VPS consegue rodar a stack canonica, mas o pull direto de `ghcr.io/collettaa/site-caicara:latest`
continua dependendo de permissao no GitHub Container Registry.

### Caminho recomendado

1. Fazer push na `main` com este `Dockerfile`, que agora publica a imagem com
   `org.opencontainers.image.source=https://github.com/Collettaa/site-caicara`.
2. Reexecutar o workflow `Publish Docker image` pelo GitHub Actions, se necessario.
3. No GitHub web:
   - avatar no canto superior direito
   - `Your packages`
   - abrir o pacote `site-caicara`
   - `Package settings`
4. Escolher uma das estrategias abaixo.

### Opcao A: deixar o pacote publico

Se o pacote puder ser publico, no `Package settings` altere a visibilidade para `Public`.
No Container registry, pacotes publicos podem ser baixados anonimamente.

### Opcao B: manter o pacote privado

Se o pacote precisar continuar privado:

1. No GitHub web:
   - `Settings`
   - `Developer settings`
   - `Personal access tokens`
   - `Tokens (classic)`
   - `Generate new token (classic)`
2. Criar um token com pelo menos `read:packages`.
3. Na VPS, autenticar o Docker:

```bash
echo '<TOKEN>' | docker login ghcr.io -u Collettaa --password-stdin
docker pull ghcr.io/collettaa/site-caicara:latest
```

4. Depois do `docker pull` funcionar, atualizar a stack oficial para usar a imagem do GHCR:

```bash
docker stack deploy -c docker-compose.yml site-caicara
```

## Verificacao

Depois do deploy:

```bash
docker service ls
curl -I https://caicara.store
curl -I https://www.caicara.store
curl -I https://caicara.store/blog
```

Resultado esperado:

- so um servico web do site ativo no Swarm
- `https://caicara.store` e `https://www.caicara.store` respondendo `200` ou `301`
- `https://caicara.store/blog` respondendo `200`
- sem outro router do Traefik usando os mesmos hosts
- se alguma chave externa estiver errada, o site ainda sobe e responde

## Loja — variáveis e deploy

Variáveis no serviço (`docker service update --env-add NOME=valor site-caicara_web` ou na stack):

| Variável | O que é |
|---|---|
| `LOJA_ASAAS_API_KEY` | Chave da conta Asaas **da loja**. Nunca a `ASAAS_API_KEY` (é do Aulão Rosa). |
| `LOJA_ASAAS_URL` | Teste: `https://sandbox.asaas.com/api/v3`. Produção: `https://api.asaas.com/v3`. |
| `ASAAS_WEBHOOK_TOKEN` | Token do webhook. O mesmo valor vai no painel do Asaas. |
| `ADMIN_SENHA` | Senha do `/admin`. |
| `ADMIN_COOKIE_SECRET` | Segredo que assina o cookie do admin. Trocar desloga todo mundo. |
| `SITE_URL` | `https://caicara.store` (links do pedido e retorno do pagamento). |

Gerar segredo (token do webhook e segredo do cookie), um para cada:

```bash
openssl rand -base64 32
```

`ASAAS_API_KEY` e `ASAAS_URL` continuam como estão: são do Aulão Rosa e da aula avulsa.

### Menu "Loja"

`LOJA_NO_MENU` é fixado no build, não no serviço. Sem ele a loja funciona em `/loja`, mas não aparece
no menu. Só quando for abrir a loja:

```bash
cd /root/site-caicara && git pull
H=$(git rev-parse --short HEAD)
docker build --build-arg LOJA_NO_MENU=1 -t site-caicara:$H .
docker service update --image site-caicara:$H site-caicara_web
```

Antes disso, o build é o de sempre (`docker build -t site-caicara:<hash> .`), sem `--build-arg`.
Depois de aberta, todo build precisa do `--build-arg LOJA_NO_MENU=1`; sem ele o menu some.

### Webhook no painel do Asaas

Na conta da loja: Integrações → Webhooks → novo webhook.

- URL: `https://caicara.store/api/loja/asaas`
- Eventos: `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`
- Token de autenticação: o mesmo valor de `ASAAS_WEBHOOK_TOKEN`
- Fila ativa

Cadastrar o domínio `caicara.store` em Minha Conta → Informações. Sem isso o Asaas recusa o retorno
automático para a página do pedido; a cobrança sai sem retorno e o log avisa.

### Troca sandbox → produção

1. `LOJA_ASAAS_URL=https://api.asaas.com/v3` e `LOJA_ASAAS_API_KEY` com a chave real.
2. Criar o webhook na conta real (o da sandbox não vale lá), mesma URL, mesmos eventos, mesmo token.
3. Cadastrar `caicara.store` em Minha Conta → Informações da conta real.
4. Os pedidos do teste continuam no `loja.db` e saem no CSV (datas antes da abertura). Conferir o
   estoque no `/admin` e cadastrar o produto de verdade.
5. Build com `--build-arg LOJA_NO_MENU=1` (acima).

### Backup

Banco `loja.db` e fotos `loja/fotos/` ficam em `/app/data`, no volume `site_caicara_data` (no Swarm,
o nome real leva o prefixo da stack: conferir com `docker volume ls | grep caicara_data`). Copiar
esse volume copia a loja inteira:

```bash
VOL=$(docker volume ls -q | grep site_caicara_data)
docker run --rm -v "$VOL":/data -v "$PWD":/backup alpine \
  tar czf /backup/site-data-$(date +%F).tgz -C /data .
```

Roteiro de teste na sandbox: `docs/loja-teste.md`.

## Loja — webhook do Asaas

O Asaas pausa a fila de webhooks quando o site responde erro várias vezes seguidas. Depois de queda
do Asaas ou do site (deploy demorado, VPS fora):

1. Abrir o painel do Asaas da loja → Integrações → Webhooks.
2. Ver se a fila do webhook `https://caicara.store/api/loja/asaas` está pausada (ou com eventos com erro).
3. Se estiver, reativar a fila. Os eventos parados são reenviados.

Enquanto a fila estiver pausada, o verificador de 5 min ainda confirma os pedidos em aberto, mas o
"Pago ✅" demora mais a aparecer.
