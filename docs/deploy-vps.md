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
