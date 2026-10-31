# 📦 UnderStok — Sistema de Consulta, Gestão e Aprendizado Logístico (CD Extrema MG)

> **Especialista de Estoque Logístico • Arquitetura de Dados • Engenharia de Software & PWA Mobile**

O **UnderStok** é uma plataforma web interativa e **Progressive Web App (PWA)** (instalável no **Android, iOS e Desktop**) projetada para transformar a matriz operacional de **Centros e Depósitos de Extrema MG (Midea Carrier)** em um sistema vivo de consulta, gestão (CRUD + movimentação) e treinamento acelerado para novos integrantes, operadores e gestores.

---

## 🧠 1. Análise Profunda da Matriz Logística (Extrema MG)

A partir da análise integral da planilha operacional anexa, toda a estrutura foi normalizada em **7 Centros Logísticos** e **21 Depósitos Operacionais**, governados pelas seguintes regras de negócio:

### 🏢 Os 7 Centros de Distribuição (CD Extrema MG)

| Centro | Saída | Canal / Operação | Origem | Material | Estoque Livre Padrão |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **`B123`** | `FIFO` | CD MG Nacional E-Commerce | Nacional (Brasil) | `PRODUTOS` | `B110` (Produtos) |
| **`B124`** | `FIFO` | CD MG Importado E-Commerce | Importado (China) | `PRODUTOS` | `B110` (Produtos) |
| **`B125`** | `FIFO` | Virtual / Transitório Internacional | Virtual / Internacional | `PEÇAS/PRODUTOS` | *Trâmite Virtual / Sinistro `B145`* |
| **`B158`** | `LIFO` | CD MG Nacional Lojas Midea Carrier | Nacional (Brasil) | `PEÇAS/PRODUTOS` | `B114` (Prod), `B130` (Peças), `B416` (Blue Service) |
| **`B159`** | `LIFO` | CD MG Import. Lojas Midea Carrier | Importado | `PEÇAS/PRODUTOS` | `B114` (Prod), `B130` (Peças), `B416` (Blue Service) |
| **`B179`** | `FIFO` | CD MG Nacional Pós-Venda / Garantia | Nacional (Brasil) | `PEÇAS/PRODUTOS` | `B413` (Prod), `B412` (Peças) |
| **`B180`** | `FIFO` | CD MG Import. Pós-Venda / Garantia | Importado | `PEÇAS/PRODUTOS` | `B413` (Prod), `B412` (Peças) |

---

## ☁️ 2. Como Conectar ao Google Planilhas + Apps Script (100% Gratuito)

1. Crie uma planilha em [sheets.new](https://sheets.new).
2. No menu superior da planilha, clique em **Extensões ➔ Apps Script**.
3. Copie todo o conteúdo do arquivo [`backend/Code.gs`](./backend/Code.gs) e cole no editor do Apps Script.
4. Execute a função **`gerarPlanilhaCompletaExtremaMG`** (ou use o menu **📦 UnderStok Extrema MG** que aparece na planilha) para criar e popular automaticamente todas as abas (`Matriz_Visual`, `Centros`, `Depositos`, `Glossario_Treinamento` e `Historico_Movimentacoes`)!
5. Clique em **Implantar ➔ Nova implantação ➔ App da Web**, defina *"Quem pode acessar: Qualquer pessoa"* e cole a URL gerada dentro do Web App **UnderStok**.
