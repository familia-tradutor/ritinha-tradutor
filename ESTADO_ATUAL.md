# V1.0 ESTÁVEL - 21/07/2026 19:22
## Estado que funciona 100% - NÃO APAGAR

O que está funcionando:
- Globo dourado com 500 partículas + anéis
- Línguas fixas: PT BR, US EN, ES, IT, FR, LA + América do Sul toda (AR, CL, CO, PE, VE, UY, PY, BO, EC, GY, SR)
- Modo conversa contínuo: fica ativo até clicar PARAR
- Não atropela mais a fala - continuous:true + interimResults:true
- Transcrição completa aparece em tempo real
- Tradução só quando clica PARAR
- Botão de reverso ↔ funcionando
- Layout limpo: línguas só em cima, 2 botões MIC embaixo

Se quebrar no futuro, voltar com:
git checkout v1.0-estavel-conversa-continua -- src/app/page.tsx src/app/api/translate/route.ts
