import { PublicPortfolio } from './public-portfolio.service';

// Snapshot data lokal (diambil dari DB local), dipakai landing.component.ts saat mode statis
// aktif (environment.useStaticData). Gambar (foto profil & file project) ditaruh sebagai
// asset biasa di src/assets/static-portfolio, bukan base64, biar bundle gak bengkak.
export const STATIC_PORTFOLIO: PublicPortfolio = {
  "active_landing_page": "landing_page_3",
  "username": "stephen.wau",
  "profile": {
    "full_name": "Stephen Wau",
    "position": "Backend Developer",
    "email": "waustephen@gmail.com",
    "wa_number": "085362737508",
    "linkedin": "www.linkedin.com/in/stephen-wau",
    "github": "https://github.com/Stephen-Wau",
    "city": "Jakarta Barat, Indonesia",
    "about_me": "<p>&quot;A&nbsp;results-driven&nbsp;<strong>Backend&nbsp;Developer</strong>&nbsp;with&nbsp;3&nbsp;years&nbsp;of&nbsp;professional&nbsp;experience&nbsp;specializing&nbsp;in&nbsp;building&nbsp;secure,&nbsp;scalable,&nbsp;and&nbsp;high-performance&nbsp;web&nbsp;applications.&nbsp;Graduated&nbsp;with&nbsp;a&nbsp;Cum&nbsp;Laude&nbsp;degree&nbsp;in&nbsp;Informatics&nbsp;Engineering,&nbsp;combining&nbsp;strong&nbsp;academic&nbsp;foundations&nbsp;with&nbsp;proven&nbsp;expertise&nbsp;in&nbsp;Laravel,&nbsp;CodeIgniter,&nbsp;and&nbsp;RESTful&nbsp;API&nbsp;architecture.&nbsp;Adept&nbsp;at&nbsp;managing&nbsp;the&nbsp;entire&nbsp;development&nbsp;lifecycle,&nbsp;from&nbsp;database&nbsp;design&nbsp;and&nbsp;third-party&nbsp;integration&nbsp;to&nbsp;optimizing&nbsp;CI/CD&nbsp;pipelines&nbsp;and&nbsp;implementing&nbsp;AI-driven&nbsp;monitoring&nbsp;tools.&nbsp;Known&nbsp;for&nbsp;a&nbsp;meticulous&nbsp;and&nbsp;adaptive&nbsp;approach,&nbsp;thrive&nbsp;in&nbsp;collaborative&nbsp;team&nbsp;environments,&nbsp;and&nbsp;consistently&nbsp;dedicated&nbsp;to&nbsp;modernizing&nbsp;legacy&nbsp;systems&nbsp;and&nbsp;adopting&nbsp;cutting-edge&nbsp;technologies.&quot;</p>",
    "image": "assets/static-portfolio/profile.jpg"
  },
  "work_histories": [
    {
      "id": 15,
      "company_name": "PT Uniktif Media Indonesia (Unictive)",
      "position": "Senior Backend Engineer",
      "start_date": "2024-01",
      "end_date": null,
      "points": [
        "Develop and maintain Laravel-based & CodeIgniter applications (CMS, attendance, finance, payroll, retail).",
        "Build RESTful API for integration with frontend/mobile apps.",
        "Implement Git version control and CI/CD workflow for automated deployment.",
        "Database query optimization and logging for error monitoring.",
        "Collaborate with frontend team, QA, and stakeholders.",
        "Developed Single Sign-On (SSO) applications with multi-authentication capabilities, utilizing full-stack CMS frameworks (Laravel) and standalone RESTful API architectures.",
        "Revamped legacy applications by upgrading tech stacks to the latest versions and implementing complex new features to maximize system performance.",
        "Executed database migrations and schema optimizations to ensure smooth system upgrades and zero data loss during application modernizations.",
        "Integrated third-party RESTful APIs into backend services to expand application functionalities and streamline data synchronization.",
        "mplemented automated logging and error-tracking solutions by leveraging AI tools to accelerate debugging processes and reduce system downtime."
      ]
    },
    {
      "id": 14,
      "company_name": "Immanuel Christian University",
      "position": "Assistant Lecturer and Student Mentor",
      "start_date": "2023-02",
      "end_date": "2023-08",
      "points": [
        "Guiding students in understanding the courses being studied both theory and practice",
        "Help and explain to students if there are errors in the program created",
        "Assist lecturers in practicum and assess homework",
        "Developing a syllabus for theoretical lessons and course materials for lab exercises, specifically in web and application development"
      ]
    },
    {
      "id": 13,
      "company_name": "PT Travelxism",
      "position": "Junior Backend Technology and Innovation",
      "start_date": "2022-08",
      "end_date": "2023-01",
      "points": [
        "As a coordinator in dividing tasks and monitoring the progress of the team's work",
        "As a fullstack developer in creating travelxism website",
        "UI/UX for website interface design and e-commerce",
        "Tester to assess the performance and function of the website created during the internship",
        "Build a company profile for promotion products"
      ]
    }
  ],
  "educations": [
    {
      "id": 1,
      "place": "Immanuel Christian University",
      "major": "Bachelor of Informatics (GPA 3.86)",
      "start_date": "2019-08",
      "end_date": "2023-09"
    },
    {
      "id": 6,
      "place": "Bintang Laut Catholic High School",
      "major": "Science Major",
      "start_date": "2016-08",
      "end_date": "2019-05"
    }
  ],
  "skills": [
    {
      "id": 37,
      "title": "Vulnerability Remediation",
      "type": "hard_skill"
    },
    {
      "id": 11,
      "title": "VS Code",
      "type": "software_skill"
    },
    {
      "id": 16,
      "title": "Version Control & Pipelines",
      "type": "software_skill"
    },
    {
      "id": 32,
      "title": "Termius",
      "type": "software_skill"
    },
    {
      "id": 10,
      "title": "Team Work",
      "type": "soft_skill"
    },
    {
      "id": 23,
      "title": "Team Management",
      "type": "soft_skill"
    },
    {
      "id": 19,
      "title": "SSO Auth Integration",
      "type": "hard_skill"
    },
    {
      "id": 9,
      "title": "Set-up Server",
      "type": "hard_skill"
    },
    {
      "id": 14,
      "title": "Server Deployment",
      "type": "hard_skill"
    },
    {
      "id": 28,
      "title": "Restful API",
      "type": "hard_skill"
    },
    {
      "id": 35,
      "title": "Problem Solving",
      "type": "soft_skill"
    },
    {
      "id": 39,
      "title": "Postman",
      "type": "software_skill"
    },
    {
      "id": 7,
      "title": "PHP",
      "type": "hard_skill"
    },
    {
      "id": 24,
      "title": "MySQL",
      "type": "hard_skill"
    },
    {
      "id": 29,
      "title": "Multi Project Work",
      "type": "soft_skill"
    },
    {
      "id": 38,
      "title": "Microsoft IIS",
      "type": "software_skill"
    },
    {
      "id": 13,
      "title": "Laravel",
      "type": "hard_skill"
    },
    {
      "id": 8,
      "title": "JavaScript",
      "type": "hard_skill"
    },
    {
      "id": 36,
      "title": "Identity & Access Management (IAM)",
      "type": "hard_skill"
    },
    {
      "id": 22,
      "title": "HTML, CSS, Jquery",
      "type": "hard_skill"
    },
    {
      "id": 34,
      "title": "High Productivity",
      "type": "soft_skill"
    },
    {
      "id": 25,
      "title": "Google Cloud IAP",
      "type": "software_skill"
    },
    {
      "id": 18,
      "title": "Golang",
      "type": "hard_skill"
    },
    {
      "id": 26,
      "title": "Github",
      "type": "software_skill"
    },
    {
      "id": 40,
      "title": "Firebase",
      "type": "software_skill"
    },
    {
      "id": 17,
      "title": "Database Management",
      "type": "hard_skill"
    },
    {
      "id": 41,
      "title": "Cross-Functional Collaboration",
      "type": "soft_skill"
    },
    {
      "id": 30,
      "title": "Communication",
      "type": "soft_skill"
    },
    {
      "id": 21,
      "title": "Codex AI",
      "type": "software_skill"
    },
    {
      "id": 15,
      "title": "CodeIgniter4",
      "type": "hard_skill"
    },
    {
      "id": 33,
      "title": "Cloudflare",
      "type": "software_skill"
    },
    {
      "id": 20,
      "title": "Claude AI",
      "type": "software_skill"
    },
    {
      "id": 27,
      "title": "Bitbucket",
      "type": "software_skill"
    },
    {
      "id": 31,
      "title": "Analytical Thinking",
      "type": "soft_skill"
    }
  ],
  "technical_projects": [
    {
      "id": 12,
      "name_project": "Unisign SSO (Centralized Identity & Access Management Platform)",
      "user_role": "Backend Developer",
      "description": "Engineered an advanced, secure Single Sign-On (SSO) and Identity Management ecosystem equipped with real-time security monitoring dashboards, centralized user permissions, and dynamic session control paneling.",
      "tech_stack": "Laravel, PHP, MySQL, JWT, Vite, Blade, jQuery, Geolocation API, Firebase, RESTful API.",
      "key_contributions": [
        "Developed core Identity & Access Management (IAM) mechanics using token-based authentication (JWT) and ticketing systems to authorize connections safely across multiple client applications.",
        "Designed complex session security structures, including multi-tier token revocation (per-user or via master data override), active session controls, and two distinct logout models: Device Logout and Single Logout (SLO).",
        "Built a dynamic policy configuration engine that enables real-time adjustments for session Time-To-Live (TTL), centralized Google Login integration via Firebase, and runtime toggles for master passwords.",
        "Integrated Geolocation tracking APIs to capture geographic data from login attempts, mapping historical coordinates into an analytical dashboard to track application traffic, login success rates, and monitor real-time threat detection (Risk Events)."
      ],
      "files": [
        {
          "id": 24,
          "file_name": "doc_1.png",
          "file_data": "assets/static-portfolio/projects/project-1-1.png"
        },
        {
          "id": 25,
          "file_name": "doc_2.png",
          "file_data": "assets/static-portfolio/projects/project-1-2.png"
        },
        {
          "id": 26,
          "file_name": "doc_3.png",
          "file_data": "assets/static-portfolio/projects/project-1-3.png"
        },
        {
          "id": 27,
          "file_name": "doc_4.png",
          "file_data": "assets/static-portfolio/projects/project-1-4.png"
        },
        {
          "id": 28,
          "file_name": "doc_5.png",
          "file_data": "assets/static-portfolio/projects/project-1-5.png"
        }
      ]
    },
    {
      "id": 13,
      "name_project": "TMS (Injourney Tenant & Airport Infrastructure Management System)",
      "user_role": "Backend Developer",
      "description": "Managed and modernized the Tenant Management System (TMS) for Injourney, handling both legacy application maintenance and complete system revamp to optimize airport operational data, tenant tracking, and resource allocation across national airport branches.",
      "tech_stack": "Laravel, CodeIgniter 3 (CI3), PHP, MySQL, RESTful API, Familia SSO Integration",
      "key_contributions": [
        "Maintained the existing monolithic application (CI3), developing interactive analytics dashboards to track branch-specific flight expenditures, shopping data, production equipment, terminal assets, and parking logistics through complex data charts.",
        "Engineered core backend modules for contract life cycles, including TMS Contracts, Tenant Bookings, Contract Addendums, and multi-level master data management for vendors and airport production tools.",
        "Spearheaded the architectural revamp into a modern, decoupled Laravel RESTful API backend, accelerating data processing speeds and decoupling the legacy system into a scalable API-driven architecture.",
        "Refactored the data layer by revamping the database schema, optimizing slow database queries, and executing complex legacy data migrations into the new structure with zero data loss and maximum query efficiency.",
        "ntegrated unified authentication for both legacy and revamped system variants using Injourney's centralized Familia Single Sign-On (SSO) ecosystem."
      ],
      "files": [
        {
          "id": 29,
          "file_name": "doc_1.png",
          "file_data": "assets/static-portfolio/projects/project-2-1.png"
        },
        {
          "id": 30,
          "file_name": "doc_2.png",
          "file_data": "assets/static-portfolio/projects/project-2-2.png"
        },
        {
          "id": 31,
          "file_name": "doc_3.png",
          "file_data": "assets/static-portfolio/projects/project-2-3.png"
        },
        {
          "id": 32,
          "file_name": "doc_4.png",
          "file_data": "assets/static-portfolio/projects/project-2-4.png"
        }
      ]
    },
    {
      "id": 5,
      "name_project": "Titan (Multi-Company ERP Ecosystem)",
      "user_role": "Full-Stack Developer",
      "description": "Developed a comprehensive, high-scalability Enterprise Resource Planning (ERP) application from scratch, designed to manage multi-company configurations and operations within a single centralized platform.",
      "tech_stack": "Laravel, Blade, JavaScript, MySQL, Git, CI/CD, RestFull API, Next.js",
      "key_contributions": [
        "Engineered a massive enterprise ecosystem by designing both frontend interfaces and backend logic for core business modules: Core HR & Workforce Management (Attendance, Timesheet, Leave, Overtime, Business Trip), Financial Operations (Payroll, Finance, Purchase Orders (PO), Reimbursement), and Asset & Project Infrastructure (Asset Inventory, Project Management, Workspace, Analytics Reporting).",
        "Developed robust Financial Operations & Advanced Accounting features—adopting core functionalities of industry-standard software like Accurate—including automated Payroll, Purchase Orders (PO), Reimbursement, Corporate Taxation Management, and Real-Time Project Cash Flow Tracking.",
        "Structured a highly granular, multi-tenant database and role-based access control (RBAC) to ensure strict data isolation, zero financial data discrepancy, and bulletproof security across different business subsidiaries.",
        "Automated complex financial calculations, tax computations, and dynamic generation of financial balance reports to streamline executive decision-making."
      ],
      "files": [
        {
          "id": 4,
          "file_name": "doc_1.png",
          "file_data": "assets/static-portfolio/projects/project-3-1.png"
        },
        {
          "id": 5,
          "file_name": "doc_2.png",
          "file_data": "assets/static-portfolio/projects/project-3-2.png"
        },
        {
          "id": 6,
          "file_name": "doc_3.png",
          "file_data": "assets/static-portfolio/projects/project-3-3.png"
        }
      ]
    },
    {
      "id": 8,
      "name_project": "Restaurant (Multi-Company CMS Platform)",
      "user_role": "Backend Developer",
      "description": "Engineered a multi-tenant Content Management System (CMS) and core RESTful API ecosystem to centralize operational data, digital signage, and menu distribution for multi-company restaurant groups.",
      "tech_stack": " Laravel, PHP, MySQL, SQLite, jQuery, AJAX, RESTful API",
      "key_contributions": [
        "Architected a secure multi-company tenant isolation system enabling administrators to seamlessly switch profiles and manage dynamic data setups across different restaurant entities post-authentication.",
        "Developed robust backend services to handle complex catalog hierarchies, including parent items, tenant products, child variants, promotional banners, hardware devices, and admin privileges.",
        "Designed automated database synchronization mechanics using SQLite and jQuery/AJAX to guarantee low-latency menu updates and seamless data control without full-page reloads."
      ],
      "files": [
        {
          "id": 11,
          "file_name": "doc_1.png",
          "file_data": "assets/static-portfolio/projects/project-4-1.png"
        },
        {
          "id": 12,
          "file_name": "doc_2.png",
          "file_data": "assets/static-portfolio/projects/project-4-2.png"
        },
        {
          "id": 13,
          "file_name": "doc_3.png",
          "file_data": "assets/static-portfolio/projects/project-4-3.png"
        }
      ]
    },
    {
      "id": 10,
      "name_project": "IA-PRO (BUMN Procurement & Tender Ecosystem)",
      "user_role": "Backend Developer",
      "description": "Developed a secure web-based procurement, open-tendering, and vendor management application tailored for the operational compliance needs of state-owned enterprise (BUMN) Injourney.",
      "tech_stack": "Laravel, PHP, MySQL, SAP Integration, Single Sign-On (SSO), RESTful API",
      "key_contributions": [
        "Engineered high-security, full-API backend services to automate complex procurement lifecycles, public open-tendering workflows, automated multi-level approvals, and formal digital correspondence.",
        "Successfully executed complex enterprise integrations by connecting backend endpoints with SAP systems to streamline Injourney’s corporate resource planning and data synchronization.",
        "Implemented secure authentication by integrating the application as a unified child application connected directly to Familia, Injourney’s centralized Single Sign-On (SSO) ecosystem."
      ],
      "files": [
        {
          "id": 19,
          "file_name": "doc_1.png",
          "file_data": "assets/static-portfolio/projects/project-5-1.png"
        },
        {
          "id": 20,
          "file_name": "doc_2.png",
          "file_data": "assets/static-portfolio/projects/project-5-2.png"
        }
      ]
    },
    {
      "id": 11,
      "name_project": "Familia - Culture (Injourney Corporate Performance & Culture Management)",
      "user_role": "Backend Developer",
      "description": "Engineered a national-scale performance and corporate culture management application utilized by all Injourney airport personnel across Indonesia to plan, report, and monitor organizational KPIs and cultural programs.",
      "tech_stack": "Laravel, PHP, MySQL, RESTful API, Familia SSO Integration, Nadia Injourney API",
      "key_contributions": [
        "Developed robust backend RESTful APIs to handle dynamic multi-role authorization levels, multi-year historical periods, corporate cultural calendars, and gamified performance leaderboards.",
        "Architected a complex hierarchical approval workflow engine that seamlessly processes task reports and program plans through multi-level validation chains, stretching from regional staff up to the Board of Directors (Dirut).",
        "Executed seamless third-party integrations with Familia SSO for centralized user authentication and Nadia Injourney services for secure corporate document management.",
        "Managed the full deployment lifecycle, including secure production environment setups, complex database migrations, and performance optimization for nationwide high-concurrency traffic."
      ],
      "files": [
        {
          "id": 21,
          "file_name": "doc_1.png",
          "file_data": "assets/static-portfolio/projects/project-6-1.png"
        },
        {
          "id": 22,
          "file_name": "doc_2.png",
          "file_data": "assets/static-portfolio/projects/project-6-2.png"
        },
        {
          "id": 23,
          "file_name": "doc_3.png",
          "file_data": "assets/static-portfolio/projects/project-6-3.png"
        }
      ]
    },
    {
      "id": 7,
      "name_project": "E-Directory (Smart Indoor Wayfinding & Mall Operations CMS)",
      "user_role": "Backend Developer",
      "description": "Engineered an enterprise operational CMS and high-performance RESTful API ecosystem to manage real-time movements, infrastructure tracking, and digital indoor wayfinding across shopping malls and large-scale exhibition halls.",
      "tech_stack": "Laravel, PHP, MySQL, SQLite, jQuery, AJAX, RESTful API.",
      "key_contributions": [
        "Developed a robust centralized CMS and core RESTful API architecture to control and monitor spatial data, including elevator movements, floor layouts, tenant listings, hardware devices, and amenities.",
        "Designed and implemented an automated database synchronization (sync) system from MySQL to SQLite, ensuring offline-ready and low-latency data availability for frontend client applications.",
        "Successfully deployed and field-tested the backend system for high-profile implementations, including the Bintaro Jaya Xchange (BxC) Mall Operations and the Gelora Bung Karno (GBK) Wayfinding System."
      ],
      "files": [
        {
          "id": 8,
          "file_name": "doc_1.png",
          "file_data": "assets/static-portfolio/projects/project-7-1.png"
        },
        {
          "id": 9,
          "file_name": "doc_3.png",
          "file_data": "assets/static-portfolio/projects/project-7-2.png"
        },
        {
          "id": 10,
          "file_name": "doc_2.png",
          "file_data": "assets/static-portfolio/projects/project-7-3.png"
        }
      ]
    },
    {
      "id": 9,
      "name_project": "BCA-Expo (Event Management Application)",
      "user_role": "Backend Developer",
      "description": "Developed and maintained critical CMS platforms and core RESTful API architectures to power Bank BCA’s major anniversary expo events across multiple editions, including Expoversary 2025, Expo 2025, Expoversary 2026, and Expo 2026.",
      "tech_stack": "Laravel, PHP, MySQL, Firebase, Microsoft IIS, Google Cloud IAP, Burp Suite, Postman, RESTful API.",
      "key_contributions": [
        "Architected a centralized CMS and comprehensive content APIs to manage high-volume event data, including product listings, home loans (KPR), automotive/motorcycle loans (KKB/KSM), insurance policies, ticketing, and event organizers.",
        "Engineered a full-API financial calculator engine for frontend data returns and built a server-to-server Firebase integration to process real-time online bidding transactions with zero latency.",
        "Optimized and managed high-scalability production databases to seamlessly handle millions of user records, event tickets, and system logs, executing secure deployments on Microsoft IIS servers via VM environments protected by Google Cloud IAP.",
        "Implemented strict banking security protocols by developing a custom encryption and decryption mechanism to safely integrate external BCA services, enabling secure QR MyBCA unified login workflows.",
        "Successfully secured the application to pass rigorous vulnerability assessments by BCA’s external pentest team (Xynesis), actively utilizing Burp Suite and Postman to diagnose, patch, and remediate all identified security flaws."
      ],
      "files": [
        {
          "id": 14,
          "file_name": "doc_1.png",
          "file_data": "assets/static-portfolio/projects/project-8-1.png"
        },
        {
          "id": 15,
          "file_name": "doc_2.png",
          "file_data": "assets/static-portfolio/projects/project-8-2.png"
        },
        {
          "id": 16,
          "file_name": "doc_3.png",
          "file_data": "assets/static-portfolio/projects/project-8-3.png"
        }
      ]
    }
  ]
};
