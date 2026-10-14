# Loja — roteiro de teste na sandbox

Teste em produção (`https://caicara.store`) com a conta **sandbox** do Asaas na loja. Antes de começar,
conferir `docs/deploy-vps.md` → "Loja — variáveis e deploy":

- [ ] `LOJA_ASAAS_URL=https://sandbox.asaas.com/api/v3` e `LOJA_ASAAS_API_KEY` da sandbox no serviço.
- [ ] `ADMIN_SENHA`, `ADMIN_COOKIE_SECRET`, `ASAAS_WEBHOOK_TOKEN`, `SITE_URL=https://caicara.store` no serviço.
- [ ] Build **sem** `LOJA_NO_MENU` (a loja abre em `/loja`, mas não aparece no menu).
- [ ] Webhook criado no painel da sandbox: `https://caicara.store/api/loja/asaas`, eventos
      `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`, token = `ASAAS_WEBHOOK_TOKEN`.
- [ ] Domínio `caicara.store` cadastrado na sandbox em Minha Conta → Informações.
- [ ] Um produto de teste cadastrado no `/admin` com pelo menos 2 variações e estoque pequeno (ex.: 2).

Usar um WhatsApp seu no pedido (as mensagens chegam nele) e um CPF válido de teste (gerador de CPF).
Na sandbox nenhum dinheiro se mexe.

## Como simular pagamento na sandbox

Pix e cartão na sandbox não cobram nada. Para marcar como pago:

- **Painel:** sandbox.asaas.com → Cobranças → abrir a cobrança do pedido (descrição tem o código) →
  "Confirmar recebimento em dinheiro" (ou, no Pix, a opção de simular pagamento, se aparecer).
- **API:** com a chave da sandbox:

```bash
curl -X POST "https://sandbox.asaas.com/api/v3/payments/<id da cobrança>/receiveInCash" \
  -H "access_token: <LOJA_ASAAS_API_KEY da sandbox>" \
  -H "Content-Type: application/json" \
  -d '{"paymentDate":"AAAA-MM-DD","value":<valor em reais>,"notifyCustomer":false}'
```

O id da cobrança (`pay_...`) está no painel da sandbox.

- **Cartão:** pagar na fatura do Asaas com um cartão de teste da documentação da sandbox
  (docs.asaas.com → Sandbox → cartões de teste). Cartão aprovado já vira `CONFIRMED`.

## Pagamentos

- [ ] **Pix pago.** Pedido com Pix → página do pedido mostra QR e copia-e-cola, total com preço do Pix.
      Simular o pagamento → em segundos a página mostra "Pago ✅", chega a mensagem de pago no
      WhatsApp, o pedido aparece pago no `/admin`.
- [ ] **Cartão 1x.** Pedido com cartão 1x → vai para a fatura do Asaas → paga com cartão de teste →
      volta sozinho para `/loja/pedido/<código>` → "Pago ✅" e mensagem no WhatsApp.
- [ ] **Cartão 2x.** Pedido com cartão 2x → a fatura mostra 2 parcelas no preço normal → paga → pedido
      pago uma vez só, uma mensagem só (não uma por parcela).

## Reserva de 1h

- [ ] **Expira em 1h.** Fazer um pedido e não pagar. Anotar o estoque da variação no `/admin` (caiu).
      Depois de 1h (+ até 5 min do verificador): pedido `cancelado` no `/admin`, estoque voltou,
      cobrança aparece cancelada/removida no painel da sandbox.
- [ ] **Última peça.** Variação com estoque 1: dois pedidos seguidos (duas abas) → o segundo recebe erro
      de estoque; estoque fica 0, nunca negativo.

## Lembretes

- [ ] **1h com caixinha.** Pedido com a caixinha de mensagens **marcada**, sem pagar → lembrete de 1h
      chega no WhatsApp (dentro de 8h–21h).
- [ ] **24h com caixinha.** Mesmo caso → lembrete de 24h chega no dia seguinte.
- [ ] **Sem caixinha.** Pedido com a caixinha **desmarcada** → nenhum lembrete (só as mensagens do
      pedido em si).
- [ ] **Fora da janela.** Pedido feito depois das 21h (ou com lembrete caindo entre 21h e 8h) → nada
      chega de madrugada; a mensagem sai a partir das 8h.

## Webhook

- [ ] **Confirma em segundos.** Pagamento simulado → "Pago ✅" em segundos, não em 5 min.
- [ ] **Token errado é recusado.** `curl -X POST https://caicara.store/api/loja/asaas -H "asaas-access-token: errado" -d '{}'`
      → `401`.
- [ ] **Repetido.** No painel da sandbox (Integrações → Webhooks → logs), reenviar o mesmo evento →
      pedido continua pago uma vez, sem segunda mensagem.

## Pago sem peça

- [ ] Variação com estoque 1. Pedido A sem pagar → esperar expirar (estoque volta a 1) → pedido B
      **paga** a última peça → simular pagamento do pedido A (cobrança de A cancelada: se o Asaas não
      deixar, pular este item) → A fica `pago_sem_peca`, chega alerta para o dono, estoque continua 0.

## Admin

- [ ] **Login.** `/admin` pede senha; senha certa entra; sessão continua ao reabrir o navegador.
- [ ] **Trava.** 5 senhas erradas seguidas → bloqueado por 15 min (mesmo acertando depois).
- [ ] **Venda no balcão.** `/admin` → Balcão → variação + forma (dinheiro, Pix na hora, maquininha) →
      estoque baixa, pedido entra como entregue, sem cobrança no Asaas.
- [ ] **Estoque.** Botão − com estoque 0 não deixa negativo.
- [ ] **CSV.** Exportar vendas → abre no Excel/Sheets; uma linha por pedido pago, com valor bruto,
      **valor líquido** (sem a taxa do Asaas), forma e origem (site/balcão). CPF não aparece.

## Não quebrou o resto

- [ ] **Aulão Rosa.** `/aulao-rosa` com avulsa → Pix gerado na conta Asaas de **produção** (a de
      sempre, `ASAAS_API_KEY`), não na sandbox da loja. Conferir no painel real e cancelar a cobrança.
- [ ] Home, `/blog` e menu sem "Loja" respondendo normal.

## Depois do teste

Troca para produção: `docs/deploy-vps.md` → "Troca sandbox → produção".
