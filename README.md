# 💳 Categorizador de Fatura

Ferramenta para importar, categorizar e analisar faturas de cartão de crédito em formato `.OFX`.

## Funcionalidades

- **Importação OFX** — arraste ou selecione o arquivo `.ofx` exportado pelo seu banco
- **Auto-categorização** — lançamentos conhecidos são categorizados automaticamente com base em regras aprendidas de faturas anteriores
- **Tags coloridas** — categorize manualmente com um clique; crie novas categorias on-the-fly
- **Filtros e busca** — filtre por categoria ou busque por descrição em tempo real
- **Dashboard** — visualize gastos por categoria em ranking e gráfico de rosca, com totais e percentuais
- **Exportação** — exporte para Excel (`.xlsx`) ou CSV com todas as categorias preenchidas

## Como usar

### Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador.

### Build para produção

```bash
npm run build
```

Os arquivos gerados ficam em `/dist` — prontos para hospedar em qualquer servidor estático (GitHub Pages, Vercel, Netlify, etc.).

## Deploy no GitHub Pages

1. Instale o plugin de deploy:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Adicione ao `package.json`:
   ```json
   "homepage": "https://<seu-usuario>.github.io/categorizador-fatura",
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. Faça o deploy:
   ```bash
   npm run deploy
   ```

## Tecnologias

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [SheetJS](https://sheetjs.com/) para exportação Excel
- Sem banco de dados — tudo roda no navegador, nenhum dado é enviado a servidores

## Privacidade

Todos os dados da fatura são processados **localmente no seu navegador**. Nenhuma informação é enviada para servidores externos.
