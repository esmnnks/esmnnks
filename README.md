<div align="center">

<a href="https://eraymenekse.com/"><img src="assets/banner.jpg" width="100%" alt="Eray Menekşe · Software Development Specialist · eraymenekse.com" /></a>

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=20&duration=3200&pause=900&color=2563EB&center=true&vCenter=true&width=640&lines=CRM+%C2%B7+ERP+%C2%B7+MES+%C2%B7+WMS+systems;AI-powered+business+automation;Customer+discovery+%26+lead+generation;C%23+%C2%B7+.NET+%C2%B7+SQL+Server+%C2%B7+Next.js" alt="CRM, ERP, MES and WMS systems · AI-powered business automation · Customer discovery and lead generation" />

<br />

[![Website](https://img.shields.io/badge/Website-eraymenekse.com-2563EB?style=for-the-badge&logo=googlechrome&logoColor=white)](https://eraymenekse.com/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-eraymenekse-0A66C2?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMC40NDcgMjAuNDUyaC0zLjU1NHYtNS41NjljMC0xLjMyOC0uMDI3LTMuMDM3LTEuODUyLTMuMDM3LTEuODUzIDAtMi4xMzYgMS40NDUtMi4xMzYgMi45Mzl2NS42NjdIOS4zNTFWOWgzLjQxNHYxLjU2MWguMDQ2Yy40NzctLjkgMS42MzctMS44NSAzLjM3LTEuODUgMy42MDEgMCA0LjI2NyAyLjM3IDQuMjY3IDUuNDU1djYuMjg2ek01LjMzNyA3LjQzM2MtMS4xNDQgMC0yLjA2My0uOTI2LTIuMDYzLTIuMDY1IDAtMS4xMzguOTItMi4wNjMgMi4wNjMtMi4wNjMgMS4xNCAwIDIuMDY0LjkyNSAyLjA2NCAyLjA2MyAwIDEuMTM5LS45MjUgMi4wNjUtMi4wNjQgMi4wNjV6bTEuNzgyIDEzLjAxOUgzLjU1NVY5aDMuNTY0djExLjQ1MnpNMjIuMjI1IDBIMS43NzFDLjc5MiAwIDAgLjc3NCAwIDEuNzI5djIwLjU0MkMwIDIzLjIyNy43OTIgMjQgMS43NzEgMjRoMjAuNDUxQzIzLjIgMjQgMjQgMjMuMjI3IDI0IDIyLjI3MVYxLjcyOUMyNCAuNzc0IDIzLjIgMCAyMi4yMjIgMGguMDAzeiIvPjwvc3ZnPg%3D%3D)](https://www.linkedin.com/in/eraymenekse)
![Based in Türkiye](https://img.shields.io/badge/Based_in-T%C3%BCrkiye-512BD4?style=for-the-badge&logo=googlemaps&logoColor=white)

</div>

## About me

I design and build business software end to end, from the database and APIs to the web and
mobile screens people use every day. My work sits where sales, production and warehouse
operations meet: **CRM, ERP, MES and WMS** systems, the integrations that keep them in sync,
and **AI-powered tools** that take repetitive work off people's plates.

## What I build

<table>
  <tr>
    <td width="33%" valign="top">
      <h3>🤝 CRM</h3>
      Customer 360, sales pipeline, quotes and dealer networks, with role- and data-based
      access control and a complete audit trail.
    </td>
    <td width="33%" valign="top">
      <h3>🏭 MES</h3>
      Work orders, shop-floor data capture and real-time production tracking and reporting.
    </td>
    <td width="33%" valign="top">
      <h3>📦 WMS</h3>
      Receiving, put-away, picking and shipping, driven by barcode-based mobile workflows.
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3>🔗 ERP integrations</h3>
      Reliable two-way sync of customers, products, orders and invoices, including
      multi-company setups.
    </td>
    <td width="33%" valign="top">
      <h3>🤖 AI &amp; automation</h3>
      LLM-powered assistants and AI agents that automate sales and back-office workflows.
    </td>
    <td width="33%" valign="top">
      <h3>🎯 Customer discovery</h3>
      Lead generation pipelines that find potential customers, enrich company data and
      score leads for the sales team.
    </td>
  </tr>
  <tr>
    <td colspan="3" valign="top">
      <h3>💬 Real-time collaboration</h3>
      Live messaging, notifications and video meetings built into business apps, on the web
      and on mobile as installable PWAs.
    </td>
  </tr>
</table>

## How the pieces fit together

```mermaid
flowchart LR
    subgraph FRONT["Front office"]
        AI["🤖 AI agents<br/>lead discovery · enrichment"]
        CRM["🤝 CRM<br/>customers · pipeline · quotes"]
    end
    subgraph BACK["Back office"]
        ERP["🔗 ERP<br/>finance · stock · invoicing"]
        MES["🏭 MES<br/>work orders · production"]
        WMS["📦 WMS<br/>receiving · picking · shipping"]
    end
    APP["📱 Web & mobile apps (PWA)"]

    AI -->|qualified leads| CRM
    CRM -->|orders| ERP
    ERP <-->|work orders| MES
    ERP <-->|stock levels| WMS
    MES -->|finished goods| WMS
    APP -.-> CRM
    APP -.-> MES
    APP -.-> WMS

    classDef core fill:#512BD4,stroke:#512BD4,color:#ffffff
    classDef ai fill:#2563EB,stroke:#2563EB,color:#ffffff
    classDef app fill:#0F766E,stroke:#0F766E,color:#ffffff
    class CRM,ERP,MES,WMS core
    class AI ai
    class APP app
```

## Tech stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=cs,dotnet,ts,react,nextjs,tailwind,git,githubactions,visualstudio,vscode,windows,powershell&perline=12" alt="C#, .NET, TypeScript, React, Next.js, Tailwind CSS, Git, GitHub Actions, Visual Studio, VS Code, Windows, PowerShell" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiPjxlbGxpcHNlIGN4PSIxMiIgY3k9IjUiIHJ4PSI5IiByeT0iMyIvPjxwYXRoIGQ9Ik0zIDV2MTRjMCAxLjY2IDQuMDMgMyA5IDNzOS0xLjM0IDktM1Y1Ii8%2BPHBhdGggZD0iTTMgMTJjMCAxLjY2IDQuMDMgMyA5IDNzOS0xLjM0IDktMyIvPjwvc3ZnPg%3D%3D" alt="SQL Server" />
  <img src="https://img.shields.io/badge/EF_Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt="Entity Framework Core" />
  <img src="https://img.shields.io/badge/SignalR-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt="SignalR" />
</p>

| Area | Technologies |
|---|---|
| **Backend** | C# · .NET · ASP.NET Core · Entity Framework Core · SignalR · REST APIs |
| **Database** | SQL Server · T-SQL · data modeling |
| **Frontend** | TypeScript · React · Next.js · Tailwind CSS · PWA |
| **AI** | LLM integrations · AI agents · prompt engineering · data enrichment |
| **Quality & DevOps** | xUnit · Playwright · Vitest · GitHub Actions · IIS |

## Engineering principles

- **Secure by default:** authentication, authorization, encryption and audit trails from day one
- **Fast:** screens and actions designed to respond in under a second
- **Tested:** unit, integration and end-to-end tests on every change
- **Global-ready:** multi-language interfaces and accessibility built in

<div align="center">

### Let's connect

[![Website](https://img.shields.io/badge/Website-eraymenekse.com-2563EB?style=for-the-badge&logo=googlechrome&logoColor=white)](https://eraymenekse.com/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-eraymenekse-0A66C2?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMC40NDcgMjAuNDUyaC0zLjU1NHYtNS41NjljMC0xLjMyOC0uMDI3LTMuMDM3LTEuODUyLTMuMDM3LTEuODUzIDAtMi4xMzYgMS40NDUtMi4xMzYgMi45Mzl2NS42NjdIOS4zNTFWOWgzLjQxNHYxLjU2MWguMDQ2Yy40NzctLjkgMS42MzctMS44NSAzLjM3LTEuODUgMy42MDEgMCA0LjI2NyAyLjM3IDQuMjY3IDUuNDU1djYuMjg2ek01LjMzNyA3LjQzM2MtMS4xNDQgMC0yLjA2My0uOTI2LTIuMDYzLTIuMDY1IDAtMS4xMzguOTItMi4wNjMgMi4wNjMtMi4wNjMgMS4xNCAwIDIuMDY0LjkyNSAyLjA2NCAyLjA2MyAwIDEuMTM5LS45MjUgMi4wNjUtMi4wNjQgMi4wNjV6bTEuNzgyIDEzLjAxOUgzLjU1NVY5aDMuNTY0djExLjQ1MnpNMjIuMjI1IDBIMS43NzFDLjc5MiAwIDAgLjc3NCAwIDEuNzI5djIwLjU0MkMwIDIzLjIyNy43OTIgMjQgMS43NzEgMjRoMjAuNDUxQzIzLjIgMjQgMjQgMjMuMjI3IDI0IDIyLjI3MVYxLjcyOUMyNCAuNzc0IDIzLjIgMCAyMi4yMjIgMGguMDAzeiIvPjwvc3ZnPg%3D%3D)](https://www.linkedin.com/in/eraymenekse)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2563EB,100:512BD4&height=110&section=footer" width="100%" alt="" />

</div>
