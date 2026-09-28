const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const AssetCategory = require('../models/AssetCategory');
const Asset = require('../models/Asset');
const Inspection = require('../models/Inspection');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const WorkOrder = require('../models/WorkOrder');
const Project = require('../models/Project');
const Vendor = require('../models/Vendor');
const Procurement = require('../models/Procurement');
const Notification = require('../models/Notification');
const LifecycleEvent = require('../models/LifecycleEvent');
const AuditLog = require('../models/AuditLog');
const { generateAssetQRCode } = require('../services/qrService');
const { calculateRisk } = require('../services/riskService');

const seedAll = async () => {
  try {
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      AssetCategory.deleteMany({}),
      Asset.deleteMany({}),
      Inspection.deleteMany({}),
      MaintenanceRequest.deleteMany({}),
      WorkOrder.deleteMany({}),
      Project.deleteMany({}),
      Vendor.deleteMany({}),
      Procurement.deleteMany({}),
      Notification.deleteMany({}),
      LifecycleEvent.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Demo Users...');
    // Demo accounts requested in Requirement 51:
    // Admin: admin@infratrack.com / Admin@123
    // Asset Manager: assetmanager@infratrack.com / Asset@123
    // Engineer: engineer@infratrack.com / Engineer@123
    // Viewer: viewer@infratrack.com / Viewer@123
    const users = await User.create([
      {
        employeeId: 'EMP-ADM-001',
        name: 'Rajesh Sharma',
        email: 'admin@infratrack.com',
        phone: '+91 98250 11001',
        password: 'Admin@123',
        role: 'SUPER_ADMIN',
        department: 'Infrastructure Administration',
        status: 'ACTIVE',
      },
      {
        employeeId: 'EMP-ASM-002',
        name: 'Priya Patel',
        email: 'assetmanager@infratrack.com',
        phone: '+91 98250 22002',
        password: 'Asset@123',
        role: 'ASSET_MANAGER',
        department: 'Asset Planning & Stewardship',
        status: 'ACTIVE',
      },
      {
        employeeId: 'EMP-ENG-003',
        name: 'Vikram Desai',
        email: 'engineer@infratrack.com',
        phone: '+91 98250 33003',
        password: 'Engineer@123',
        role: 'FIELD_ENGINEER',
        department: 'Civil Engineering & Maintenance',
        status: 'ACTIVE',
      },
      {
        employeeId: 'EMP-INS-004',
        name: 'Sunita Mehta',
        email: 'inspector@infratrack.com',
        phone: '+91 98250 44004',
        password: 'Inspector@123',
        role: 'INSPECTOR',
        department: 'Quality Assurance & Safety Inspection',
        status: 'ACTIVE',
      },
      {
        employeeId: 'EMP-VIW-005',
        name: 'Aarav Joshi',
        email: 'viewer@infratrack.com',
        phone: '+91 98250 55005',
        password: 'Viewer@123',
        role: 'VIEWER',
        department: 'Public Information Directorate',
        status: 'ACTIVE',
      },
    ]);

    const [adminUser, assetManager, engineer, inspector, viewer] = users;

    console.log('[Seed] Seeding Asset Categories...');
    // 10 categories as per requirement #2
    const categories = await AssetCategory.create([
      {
        name: 'Roads & Highways',
        code: 'ROAD',
        description: 'Expressways, arterial highways, urban ring roads, internal and rural connectivity roadways.',
        subcategories: ['Highway', 'Main Road', 'Internal Road', 'Rural Road'],
        icon: 'Navigation',
      },
      {
        name: 'Bridges & Flyovers',
        code: 'BRG',
        description: 'Road overbridges, rail bridges, river crossings, and pedestrian skywalks.',
        subcategories: ['Road Bridge', 'Railway Bridge', 'Pedestrian Bridge', 'Cable-Stayed Bridge'],
        icon: 'GitCommit',
      },
      {
        name: 'Public Buildings & Facilities',
        code: 'BLDG',
        description: 'Administrative centers, government secretariats, public hospitals, schools, and civic offices.',
        subcategories: ['Government Building', 'Hospital', 'School', 'Office', 'Warehouse'],
        icon: 'Building2',
      },
      {
        name: 'Water Infrastructure',
        code: 'WTR',
        description: 'Municipal water treatment plants, transmission mains, elevated storage reservoirs, pumping stations, and dams.',
        subcategories: ['Water Treatment Plant', 'Pipeline', 'Water Tank', 'Pumping Station', 'Dam'],
        icon: 'Droplets',
      },
      {
        name: 'Drainage & Stormwater',
        code: 'DRN',
        description: 'Stormwater channels, underground sewer networks, culverts, and urban flood gates.',
        subcategories: ['Drain', 'Stormwater System', 'Sewer Line', 'Culvert'],
        icon: 'Waves',
      },
      {
        name: 'Electrical Infrastructure',
        code: 'ELEC',
        description: 'High voltage substations, distribution transformers, smart street lighting grids, and power cabling.',
        subcategories: ['Substation', 'Transformer', 'Street Light', 'Power Distribution System'],
        icon: 'Zap',
      },
      {
        name: 'Transport Infrastructure',
        code: 'TRN',
        description: 'Multi-modal transit hubs, bus rapid terminals, metro stations, and public parking complexes.',
        subcategories: ['Bus Terminal', 'Railway Facility', 'Parking Facility', 'Metro Station'],
        icon: 'Bus',
      },
      {
        name: 'Heavy Equipment & Machinery',
        code: 'EQP',
        description: 'High-capacity standby generators, sludge pumps, heavy earthmovers, and road maintenance machinery.',
        subcategories: ['Generator', 'Pump', 'Heavy Machinery', 'Maintenance Equipment'],
        icon: 'Wrench',
      },
      {
        name: 'Renewable Energy & Solar',
        code: 'SLR',
        description: 'Rooftop solar arrays, solar canal projects, and battery energy storage stations.',
        subcategories: ['Solar Grid', 'Inverter Station', 'Battery Bank'],
        icon: 'Sun',
      },
      {
        name: 'Telecom & Smart City Sensors',
        code: 'TEL',
        description: 'Optical fiber networks, CCTV surveillance poles, traffic sensor pods, and SCADA control points.',
        subcategories: ['Fiber Ring', 'Surveillance Tower', 'Environmental Sensor'],
        icon: 'Radio',
      },
    ]);

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.code] = cat._id;
    });

    console.log('[Seed] Seeding Projects...');
    // 5 Projects
    const projects = await Project.create([
      {
        projectId: 'PRJ-2026-001',
        name: 'Ahmedabad Sardar Patel Ring Road Expansion & Upgrade',
        type: 'Highway Corridor Modernization',
        description: 'Six-laning and grade separator overhaul of the 76km strategic bypass ring road.',
        contractor: 'Larsen & Toubro Infrastructure Ltd.',
        projectManager: assetManager._id,
        startDate: new Date('2024-04-15'),
        expectedCompletion: new Date('2027-03-31'),
        budget: 4500000000,
        actualCost: 1850000000,
        status: 'IN_PROGRESS',
      },
      {
        projectId: 'PRJ-2026-002',
        name: 'Sabarmati Riverfront Bridge & River Walkway Extension',
        type: 'Urban Bridge & Riverfront Development',
        description: 'Signature icon cable-supported bridge connecting East and West Riverfront promenades.',
        contractor: 'Afcons Infrastructure Corp',
        projectManager: assetManager._id,
        startDate: new Date('2023-01-10'),
        expectedCompletion: new Date('2025-11-30'),
        budget: 1200000000,
        actualCost: 1180000000,
        status: 'COMPLETED',
      },
      {
        projectId: 'PRJ-2026-003',
        name: 'Kotarpur 500 MLD Drinking Water Treatment Augmentation',
        type: 'Municipal Water Supply Modernization',
        description: 'State-of-the-art ozonation and rapid gravity filtration facility serving 3.5 million residents.',
        contractor: 'VA Tech Wabag Engineering',
        projectManager: assetManager._id,
        startDate: new Date('2022-08-01'),
        expectedCompletion: new Date('2024-06-30'),
        budget: 2800000000,
        actualCost: 2750000000,
        status: 'COMPLETED',
      },
      {
        projectId: 'PRJ-2026-004',
        name: 'Smart Urban Drainage & Flood Mitigation Phase-2',
        type: 'Stormwater Infrastructure',
        description: 'High-discharge underground storm mains and automated telemetry pumping gates.',
        contractor: 'Tata Projects Ltd',
        projectManager: assetManager._id,
        startDate: new Date('2025-02-01'),
        expectedCompletion: new Date('2027-08-15'),
        budget: 1650000000,
        actualCost: 420000000,
        status: 'IN_PROGRESS',
      },
      {
        projectId: 'PRJ-2026-005',
        name: 'Central Secretariat Solar Energy & Net-Zero Grid',
        type: 'Renewable Power Integration',
        description: '2.5 MW rooftop photovoltaic system and microgrid storage.',
        contractor: 'Adani Solar Infrastructure',
        projectManager: assetManager._id,
        startDate: new Date('2024-09-01'),
        expectedCompletion: new Date('2025-12-15'),
        budget: 350000000,
        actualCost: 310000000,
        status: 'IN_PROGRESS',
      },
    ]);

    console.log('[Seed] Seeding Vendors...');
    // 5 Vendors
    const vendors = await Vendor.create([
      {
        name: 'Larsen & Toubro Civil Technologies',
        contactPerson: 'Manoj Verma',
        email: 'infrasales@lnt.com',
        phone: '+91 22 6752 5656',
        address: 'L&T House, Ballard Estate, Mumbai, Maharashtra 400001',
        gstNumber: '27AAACL0123M1Z9',
        rating: 4.8,
        status: 'ACTIVE',
      },
      {
        name: 'Kirloskar Brothers Industrial Pumps',
        contactPerson: 'Sanjay Deshmukh',
        email: 'waterpumps@kirloskar.com',
        phone: '+91 20 2721 4000',
        address: 'Udyog Bhavan, Tilak Road, Pune, Maharashtra 411002',
        gstNumber: '27AAACK3344K1Z3',
        rating: 4.7,
        status: 'ACTIVE',
      },
      {
        name: 'Siemens Energy & Automation India',
        contactPerson: 'Anita Rao',
        email: 'solutions@siemens.co.in',
        phone: '+91 22 3967 7000',
        address: 'Birla Centurion, Pandurang Budhkar Marg, Worli, Mumbai 400030',
        gstNumber: '27AAACS9988S1Z0',
        rating: 4.9,
        status: 'ACTIVE',
      },
      {
        name: 'JSW Steel & Bridge Fabrications',
        contactPerson: 'Devendra Singhal',
        email: 'infra.orders@jsw.in',
        phone: '+91 22 4286 1000',
        address: 'JSW Centre, Bandra Kurla Complex, Mumbai 400051',
        gstNumber: '27AAACJ4455J1Z6',
        rating: 4.6,
        status: 'ACTIVE',
      },
      {
        name: 'Philips Smart City Lighting Solutions',
        contactPerson: 'Rohan Mehra',
        email: 'smartlighting@signify.com',
        phone: '+91 124 460 6000',
        address: 'DLF Cyber City, Phase 3, Gurugram, Haryana 122002',
        gstNumber: '06AAACP1122P1Z1',
        rating: 4.5,
        status: 'ACTIVE',
      },
    ]);

    console.log('[Seed] Seeding 20 Realistic Infrastructure Assets...');
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // 20 realistic assets with diverse locations around Ahmedabad/Gujarat, conditions, and lifecycles
    const rawAssets = [
      {
        assetCode: 'ROAD-2026-0001',
        name: 'Sardar Patel Ring Road – Sector 4 Expressway',
        catCode: 'ROAD',
        type: 'Highway',
        description: '8-lane divided asphalt expressway corridor with grade-separated cloverleaf junctions.',
        ownerOrganization: 'Ahmedabad Urban Development Authority (AUDA)',
        department: 'Roads & Highways Department',
        location: {
          address: 'SP Ring Road, Bopal Cross Junction',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380058',
          latitude: 23.0365,
          longitude: 72.4645,
        },
        physicalDetails: {
          size: '14.2 km',
          length: '14,200 m',
          width: '32 m',
          material: 'Bituminous Concrete & Granular Base',
          manufacturer: 'L&T Civil Infrastructure',
          serialNumber: 'SPRR-SEC4-2022',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2021-03-15'),
          usefulLife: 25,
        },
        condition: {
          score: 88,
          rating: 'GOOD',
          lastInspectionDate: new Date('2026-06-10'),
          nextInspectionDate: new Date('2026-12-10'),
        },
        financial: {
          acquisitionCost: 1200000000,
          constructionCost: 950000000,
          currentValue: 1100000000,
          maintenanceCost: 45000000,
          totalLifecycleCost: 2195000000,
        },
        criticality: 'CRITICAL',
        projectId: projects[0]._id,
        tags: ['Highway', 'Corridor', 'AUDA', 'Tollway'],
      },
      {
        assetCode: 'BRG-2026-0001',
        name: 'Ellis Bridge – Heritage Reconstruction Span',
        catCode: 'BRG',
        type: 'Road Bridge',
        description: 'Steel-truss and reinforced arch roadway bridge spanning the Sabarmati River.',
        ownerOrganization: 'Ahmedabad Municipal Corporation (AMC)',
        department: 'Bridges & Engineering Works',
        location: {
          address: 'Ellis Bridge, Riverfront Promenade West',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380006',
          latitude: 23.0232,
          longitude: 72.5711,
        },
        physicalDetails: {
          size: '480 m Span',
          length: '480 m',
          width: '18 m',
          height: '24 m',
          material: 'Structural Steel Bowstring Truss & Cast Piles',
          manufacturer: 'JSW Steel & Bridge Fabrications',
          serialNumber: 'SBM-BRG-1892-R',
        },
        lifecycle: {
          status: 'UNDER_INSPECTION',
          commissioningDate: new Date('2018-11-20'),
          usefulLife: 75,
        },
        condition: {
          score: 64,
          rating: 'FAIR',
          lastInspectionDate: new Date('2026-08-01'),
          nextInspectionDate: new Date('2026-11-01'),
        },
        financial: {
          acquisitionCost: 450000000,
          constructionCost: 400000000,
          currentValue: 390000000,
          maintenanceCost: 32000000,
          totalLifecycleCost: 882000000,
        },
        criticality: 'HIGH',
        projectId: projects[1]._id,
        tags: ['Heritage', 'Sabarmati', 'River Crossing', 'Steel Truss'],
      },
      {
        assetCode: 'BLDG-2026-0001',
        name: 'New Civic Secretariat & Disaster Response HQ',
        catCode: 'BLDG',
        type: 'Government Building',
        description: 'Seismic Zone III certified 12-story administrative headquarters and emergency operations center.',
        ownerOrganization: 'Gujarat State Disaster Management Authority',
        department: 'Public Works Department',
        location: {
          address: 'Sector 10-B, Ch Road',
          city: 'Gandhinagar',
          district: 'Gandhinagar',
          state: 'Gujarat',
          pincode: '382010',
          latitude: 23.2156,
          longitude: 72.6369,
        },
        physicalDetails: {
          size: '45,000 sq m',
          capacity: '3,200 staff',
          material: 'Reinforced Cement Concrete & Double Glazed Façade',
          manufacturer: 'Tata Projects Infrastructure',
          serialNumber: 'GNR-HQ-2020',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2022-01-26'),
          usefulLife: 60,
        },
        condition: {
          score: 94,
          rating: 'EXCELLENT',
          lastInspectionDate: new Date('2026-05-18'),
          nextInspectionDate: new Date('2027-05-18'),
        },
        financial: {
          acquisitionCost: 850000000,
          constructionCost: 820000000,
          currentValue: 840000000,
          maintenanceCost: 18000000,
          totalLifecycleCost: 1688000000,
        },
        criticality: 'CRITICAL',
        tags: ['Secretariat', 'Emergency HQ', 'Seismic Safe', 'IGBC Gold'],
      },
      {
        assetCode: 'WTR-2026-0001',
        name: 'Kotarpur 500 MLD Water Treatment Plant',
        catCode: 'WTR',
        type: 'Water Treatment Plant',
        description: 'Multi-stage water filtration, clariflocculation, ozonation, and chlorine disinfection facility.',
        ownerOrganization: 'Ahmedabad Municipal Corporation',
        department: 'Water Supply & Sewerage Directorate',
        location: {
          address: 'Kotarpur Water Works, Airport Road',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '382475',
          latitude: 23.0886,
          longitude: 72.6412,
        },
        physicalDetails: {
          capacity: '500 MLD',
          size: '32 Acres',
          material: 'Epoxy-Coated Concrete Reservoirs & SS Piping',
          manufacturer: 'VA Tech Wabag',
          serialNumber: 'KTP-WTP-500',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2019-07-14'),
          usefulLife: 40,
        },
        condition: {
          score: 82,
          rating: 'GOOD',
          lastInspectionDate: new Date('2026-07-12'),
          nextInspectionDate: new Date('2026-10-12'),
        },
        financial: {
          acquisitionCost: 2200000000,
          constructionCost: 1950000000,
          currentValue: 2050000000,
          maintenanceCost: 65000000,
          totalLifecycleCost: 4215000000,
        },
        criticality: 'CRITICAL',
        projectId: projects[2]._id,
        tags: ['Potable Water', 'Municipal', 'Filtration', 'SCADA'],
      },
      {
        assetCode: 'DRN-2026-0001',
        name: 'East Ahmedabad Trunk Stormwater Conduit',
        catCode: 'DRN',
        type: 'Stormwater System',
        description: '3.6m diameter reinforced concrete pipe culvert network draining flash stormwater into Kharicut Canal.',
        ownerOrganization: 'Ahmedabad Municipal Corporation',
        department: 'Drainage Project Directorate',
        location: {
          address: 'Odhav Ring Road Intersection to Kharicut',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '382415',
          latitude: 23.0189,
          longitude: 72.6684,
        },
        physicalDetails: {
          length: '8,400 m',
          size: '3.6m dia',
          capacity: '120 cu m/s',
          material: 'High Strength Pre-cast Concrete',
          serialNumber: 'DRN-ODH-TRUNK-2',
        },
        lifecycle: {
          status: 'UNDER_MAINTENANCE',
          commissioningDate: new Date('2015-05-10'),
          usefulLife: 35,
        },
        condition: {
          score: 42,
          rating: 'POOR',
          lastInspectionDate: new Date('2026-08-14'),
          nextInspectionDate: new Date('2026-09-15'), // Overdue!
        },
        financial: {
          acquisitionCost: 320000000,
          constructionCost: 280000000,
          currentValue: 210000000,
          maintenanceCost: 55000000,
          totalLifecycleCost: 655000000,
        },
        criticality: 'HIGH',
        projectId: projects[3]._id,
        tags: ['Drainage', 'Flood Mitigation', 'Monsoon Ready'],
      },
      {
        assetCode: 'ELEC-2026-0001',
        name: 'Prahladnagar 220/66 kV GIS Substation',
        catCode: 'ELEC',
        type: 'Substation',
        description: 'Gas Insulated Switchgear indoor substation providing resilient power to South-West industrial and IT corridor.',
        ownerOrganization: 'Gujarat Energy Transmission Corp (GETCO)',
        department: 'Power Transmission & Distribution',
        location: {
          address: 'Corporate Road, Prahladnagar',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380015',
          latitude: 23.0089,
          longitude: 72.5085,
        },
        physicalDetails: {
          capacity: '200 MVA',
          size: '2,800 sq m',
          material: 'SF6 Gas Insulated Switchgear & Copper Busbars',
          manufacturer: 'Siemens Energy & Automation India',
          model: '8DN8 GIS',
          serialNumber: 'SMN-GIS-220-449',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2020-10-05'),
          usefulLife: 30,
        },
        condition: {
          score: 91,
          rating: 'EXCELLENT',
          lastInspectionDate: new Date('2026-04-10'),
          nextInspectionDate: new Date('2026-10-10'),
        },
        financial: {
          acquisitionCost: 680000000,
          constructionCost: 540000000,
          currentValue: 620000000,
          maintenanceCost: 24000000,
          totalLifecycleCost: 1244000000,
        },
        criticality: 'CRITICAL',
        tags: ['Substation', 'GIS', 'High Voltage', 'GETCO'],
      },
      {
        assetCode: 'TRN-2026-0001',
        name: 'Ranip Multi-Modal Transit Hub & Terminal',
        catCode: 'TRN',
        type: 'Bus Terminal',
        description: 'Integrated GSRTC intercity bus terminal with pedestrian subway connection to Ahmedabad Metro Line 2.',
        ownerOrganization: 'Gujarat State Road Transport Corp (GSRTC)',
        department: 'Transport Infrastructure',
        location: {
          address: 'Ranip Cross Road, 132ft Ring Road',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380027',
          latitude: 23.0768,
          longitude: 72.5732,
        },
        physicalDetails: {
          size: '28,000 sq m',
          capacity: '42 Bus Bays / 85,000 Daily Commuters',
          material: 'Structural Steel Canopy & Toughened Glass',
          manufacturer: 'L&T Construction',
          serialNumber: 'RNP-MMTH-01',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2021-08-15'),
          usefulLife: 45,
        },
        condition: {
          score: 86,
          rating: 'GOOD',
          lastInspectionDate: new Date('2026-06-25'),
          nextInspectionDate: new Date('2026-12-25'),
        },
        financial: {
          acquisitionCost: 780000000,
          constructionCost: 740000000,
          currentValue: 750000000,
          maintenanceCost: 31000000,
          totalLifecycleCost: 1551000000,
        },
        criticality: 'HIGH',
        tags: ['Transit Hub', 'Metro Interchange', 'GSRTC'],
      },
      {
        assetCode: 'EQP-2026-0001',
        name: 'Kotarpur Standby High-Head Turbine Pump #4',
        catCode: 'EQP',
        type: 'Pump',
        description: '2,200 kW vertical split-case centrifugal water pumping unit with automatic frequency converter.',
        ownerOrganization: 'Ahmedabad Municipal Corporation',
        department: 'Water Works Electrical & Mechanical',
        location: {
          address: 'Kotarpur Pumping Station Bay B',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '382475',
          latitude: 23.089,
          longitude: 72.6415,
        },
        physicalDetails: {
          capacity: '8,500 cu m/hr',
          size: '2200 kW',
          material: 'Nickel Bronze Impeller / Cast Steel Casing',
          manufacturer: 'Kirloskar Brothers Industrial Pumps',
          model: 'KB-VSC-850',
          serialNumber: 'KBL-2019-9941',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2019-09-01'),
          usefulLife: 18,
        },
        condition: {
          score: 76,
          rating: 'GOOD',
          lastInspectionDate: new Date('2026-05-30'),
          nextInspectionDate: new Date('2026-11-30'),
        },
        financial: {
          acquisitionCost: 48000000,
          constructionCost: 12000000,
          currentValue: 36000000,
          maintenanceCost: 9500000,
          totalLifecycleCost: 69500000,
        },
        criticality: 'HIGH',
        tags: ['Centrifugal Pump', 'High-Head', 'Water Works'],
      },
      {
        assetCode: 'SLR-2026-0001',
        name: 'Narmada Branch Canal 10 MW Solar Top Array',
        catCode: 'SLR',
        type: 'Solar Grid',
        description: 'Canal-top photovoltaic array generating clean electricity while mitigating canal water evaporation.',
        ownerOrganization: 'Sardar Sarovar Narmada Nigam Ltd (SSNNL)',
        department: 'Renewable Power Division',
        location: {
          address: 'Narmada Canal Reach Km 42-47, Sanand Road',
          city: 'Sanand',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '382110',
          latitude: 22.9845,
          longitude: 72.3789,
        },
        physicalDetails: {
          capacity: '10 MW Peak',
          size: '5.2 km Canal Reach',
          material: 'Mono PERC Solar Modules on Structural Steel Girders',
          manufacturer: 'Adani Solar Infrastructure',
          serialNumber: 'SSNNL-CANAL-10MW',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2022-03-22'),
          usefulLife: 25,
        },
        condition: {
          score: 92,
          rating: 'EXCELLENT',
          lastInspectionDate: new Date('2026-03-15'),
          nextInspectionDate: new Date('2026-09-15'),
        },
        financial: {
          acquisitionCost: 520000000,
          constructionCost: 460000000,
          currentValue: 490000000,
          maintenanceCost: 14000000,
          totalLifecycleCost: 994000000,
        },
        criticality: 'MEDIUM',
        tags: ['Canal Top', 'Solar Power', 'Green Energy', 'SSNNL'],
      },
      {
        assetCode: 'TEL-2026-0001',
        name: 'Ahmedabad Smart City Optical Backbone – Ring C',
        catCode: 'TEL',
        type: 'Fiber Ring',
        description: 'Underground 288-core armored single-mode fiber optic loop connecting 450 surveillance CCTV junction pods.',
        ownerOrganization: 'Ahmedabad Smart City Development Ltd',
        department: 'Smart City IT Infrastructure',
        location: {
          address: 'Ashram Road & SG Highway Interconnect Ring',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380009',
          latitude: 23.0412,
          longitude: 72.5621,
        },
        physicalDetails: {
          length: '42 km Ring',
          capacity: '288 Core Fiber',
          material: 'Armored Duct Trenching & HDPE Conduits',
          manufacturer: 'Sterlite Technologies',
          serialNumber: 'ASCDL-OFC-R3',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2020-04-10'),
          usefulLife: 20,
        },
        condition: {
          score: 87,
          rating: 'GOOD',
          lastInspectionDate: new Date('2026-07-20'),
          nextInspectionDate: new Date('2027-01-20'),
        },
        financial: {
          acquisitionCost: 180000000,
          constructionCost: 140000000,
          currentValue: 155000000,
          maintenanceCost: 11000000,
          totalLifecycleCost: 331000000,
        },
        criticality: 'HIGH',
        tags: ['Smart City', 'Fiber Optic', 'CCTV Backbone'],
      },
      {
        assetCode: 'ROAD-2026-0002',
        name: 'SG Highway Flyover & Grade Separator Network',
        catCode: 'ROAD',
        type: 'Main Road',
        description: 'Elevated multi-lane corridor between Pakwan Crossroads and Thaltej Junction.',
        ownerOrganization: 'National Highways Authority of India (NHAI)',
        department: 'Roads & Highways Department',
        location: {
          address: 'Sarkhej - Gandhinagar Highway, Thaltej',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380054',
          latitude: 23.0528,
          longitude: 72.5186,
        },
        physicalDetails: {
          length: '4.8 km',
          size: '6-Lane Elevated',
          material: 'Prestressed Concrete Box Girders',
          manufacturer: 'L&T Infrastructure',
          serialNumber: 'SGH-ELEV-03',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2021-12-10'),
          usefulLife: 50,
        },
        condition: {
          score: 89,
          rating: 'GOOD',
          lastInspectionDate: new Date('2026-06-04'),
          nextInspectionDate: new Date('2026-12-04'),
        },
        financial: {
          acquisitionCost: 1650000000,
          constructionCost: 1450000000,
          currentValue: 1580000000,
          maintenanceCost: 28000000,
          totalLifecycleCost: 3128000000,
        },
        criticality: 'CRITICAL',
        tags: ['SG Highway', 'Elevated Corridor', 'NHAI'],
      },
      {
        assetCode: 'BRG-2026-0002',
        name: 'Atal Pedestrian Skywalk & Footbridge',
        catCode: 'BRG',
        type: 'Pedestrian Bridge',
        description: 'Iconic kite-themed steel pedestrian footbridge connecting flower park to arts center on Sabarmati.',
        ownerOrganization: 'Sabarmati Riverfront Development Corp',
        department: 'Bridges & Engineering Works',
        location: {
          address: 'Sabarmati Riverfront Flower Park',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380001',
          latitude: 23.0165,
          longitude: 72.5784,
        },
        physicalDetails: {
          length: '300 m',
          width: '14 m',
          material: 'Architectural Structural Steel & Tensile Fabric Roof',
          serialNumber: 'SRFDCL-ATAL-01',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2022-08-27'),
          usefulLife: 60,
        },
        condition: {
          score: 95,
          rating: 'EXCELLENT',
          lastInspectionDate: new Date('2026-08-20'),
          nextInspectionDate: new Date('2027-02-20'),
        },
        financial: {
          acquisitionCost: 740000000,
          constructionCost: 700000000,
          currentValue: 720000000,
          maintenanceCost: 12000000,
          totalLifecycleCost: 1452000000,
        },
        criticality: 'MEDIUM',
        projectId: projects[1]._id,
        tags: ['Sabarmati', 'Pedestrian', 'Tourism', 'Iconic'],
      },
      {
        assetCode: 'BLDG-2026-0002',
        name: 'Sardar Vallabhbhai Patel Multi-Specialty Hospital',
        catCode: 'BLDG',
        type: 'Hospital',
        description: '1,500 bed quaternary healthcare facility with rooftop air ambulance helipad.',
        ownerOrganization: 'Ahmedabad Municipal Corporation',
        department: 'Medical Education & Public Health',
        location: {
          address: 'Ellisbridge Waterfront Complex',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380006',
          latitude: 23.0195,
          longitude: 72.5722,
        },
        physicalDetails: {
          size: '110,000 sq m',
          capacity: '1,500 Beds / 18 OTs',
          material: 'Base-Isolated Seismic Structure',
          serialNumber: 'SVP-HOSP-2019',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2019-01-17'),
          usefulLife: 70,
        },
        condition: {
          score: 84,
          rating: 'GOOD',
          lastInspectionDate: new Date('2026-04-12'),
          nextInspectionDate: new Date('2026-10-12'),
        },
        financial: {
          acquisitionCost: 5800000000,
          constructionCost: 5200000000,
          currentValue: 5500000000,
          maintenanceCost: 140000000,
          totalLifecycleCost: 11140000000,
        },
        criticality: 'CRITICAL',
        tags: ['Hospital', 'Emergency Health', 'Helipad', 'Base-Isolated'],
      },
      {
        assetCode: 'WTR-2026-0002',
        name: 'Vastrapur Elevated Storage Reservoir (ESR)',
        catCode: 'WTR',
        type: 'Water Tank',
        description: '35m high reinforced concrete overhead staging tank with 2.5 million liter capacity.',
        ownerOrganization: 'Ahmedabad Municipal Corporation',
        department: 'Water Supply Department',
        location: {
          address: 'Near Vastrapur Lake Garden',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380015',
          latitude: 23.0345,
          longitude: 72.5298,
        },
        physicalDetails: {
          capacity: '2.5 ML',
          height: '35 m',
          material: 'Reinforced Hydrophobic Cement Concrete',
          serialNumber: 'AMC-VST-ESR-03',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2014-06-15'),
          usefulLife: 35,
        },
        condition: {
          score: 71,
          rating: 'FAIR',
          lastInspectionDate: new Date('2026-02-18'),
          nextInspectionDate: new Date('2026-08-18'), // Overdue!
        },
        financial: {
          acquisitionCost: 65000000,
          constructionCost: 58000000,
          currentValue: 42000000,
          maintenanceCost: 14000000,
          totalLifecycleCost: 137000000,
        },
        criticality: 'HIGH',
        tags: ['Overhead Reservoir', 'Vastrapur', 'Gravity Feed'],
      },
      {
        assetCode: 'DRN-2026-0002',
        name: 'Vasna Barrage Sluice Gates & Siphon',
        catCode: 'DRN',
        type: 'Stormwater System',
        description: '28-bay hydraulic gate barrage regulating water levels and flood discharges downstream of Sabarmati.',
        ownerOrganization: 'Irrigation & Flood Control Department',
        department: 'Water Resources & Drainage',
        location: {
          address: 'Vasna Barrage Road, Vasna',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380007',
          latitude: 22.9984,
          longitude: 72.5518,
        },
        physicalDetails: {
          size: '28 Gate Bays',
          capacity: '14,000 cu m/s peak discharge',
          material: 'Structural Steel Sluice Radial Gates',
          manufacturer: 'Triveni Engineering',
          serialNumber: 'VSN-BRG-G28',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('1998-07-20'),
          usefulLife: 30, // 28 years old! Approaching end of useful life (Requirement 29)
        },
        condition: {
          score: 48,
          rating: 'POOR',
          lastInspectionDate: new Date('2026-07-05'),
          nextInspectionDate: new Date('2026-10-05'),
        },
        financial: {
          acquisitionCost: 350000000,
          constructionCost: 320000000,
          currentValue: 80000000,
          maintenanceCost: 110000000,
          totalLifecycleCost: 780000000,
        },
        criticality: 'CRITICAL',
        tags: ['Flood Gate', 'End-of-life Candidate', 'Sabarmati', 'Barrage'],
      },
      {
        assetCode: 'ELEC-2026-0002',
        name: 'SG Highway Smart LED Street Lighting Grid',
        catCode: 'ELEC',
        type: 'Street Light',
        description: '3,200 connected smart LED luminaires with central CMS dimming, energy metering, and fault telemetry.',
        ownerOrganization: 'Ahmedabad Urban Development Authority',
        department: 'Electrical Works',
        location: {
          address: 'SG Highway Corridor (Sarkhej to Vaishnodevi Circle)',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '382481',
          latitude: 23.0812,
          longitude: 72.5342,
        },
        physicalDetails: {
          size: '3,200 Poles',
          capacity: '180W LED per Luminaire',
          material: 'Hot-Dip Galvanized Octagonal Steel Poles',
          manufacturer: 'Philips Smart City Lighting Solutions',
          model: 'Signify CityTouch',
          serialNumber: 'PHL-CMS-SGH-3200',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2022-05-15'),
          usefulLife: 15,
        },
        condition: {
          score: 90,
          rating: 'EXCELLENT',
          lastInspectionDate: new Date('2026-05-12'),
          nextInspectionDate: new Date('2026-11-12'),
        },
        financial: {
          acquisitionCost: 95000000,
          constructionCost: 80000000,
          currentValue: 85000000,
          maintenanceCost: 12000000,
          totalLifecycleCost: 187000000,
        },
        criticality: 'MEDIUM',
        tags: ['Smart Lighting', 'IoT', 'Energy Efficient'],
      },
      {
        assetCode: 'EQP-2026-0002',
        name: 'Mobile Flood Dewatering Diesel Pump Unit #1',
        catCode: 'EQP',
        type: 'Heavy Machinery',
        description: 'High-volume trailer-mounted emergency dewatering suction pump with Deutz turbo-diesel engine.',
        ownerOrganization: 'Ahmedabad Fire & Emergency Services',
        department: 'Disaster Rapid Response',
        location: {
          address: 'Danapith Central Fire Station',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380001',
          latitude: 23.0245,
          longitude: 72.5891,
        },
        physicalDetails: {
          capacity: '3,600 cu m/hr',
          size: 'Trailer Mounted 450 HP',
          material: 'Alloy Steel Impeller / High-Strength Trailer Chassis',
          manufacturer: 'Kirloskar Brothers Industrial Pumps',
          serialNumber: 'KBL-EMG-PMP-1',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2023-04-10'),
          usefulLife: 15,
        },
        condition: {
          score: 93,
          rating: 'EXCELLENT',
          lastInspectionDate: new Date('2026-06-01'),
          nextInspectionDate: new Date('2026-12-01'),
        },
        financial: {
          acquisitionCost: 18500000,
          constructionCost: 2000000,
          currentValue: 17000000,
          maintenanceCost: 1500000,
          totalLifecycleCost: 22000000,
        },
        criticality: 'HIGH',
        tags: ['Emergency Pump', 'Monsoon De-watering', 'Trailer Mounted'],
      },
      {
        assetCode: 'ROAD-2026-0003',
        name: 'Dholera SIR Express Highway Phase-1',
        catCode: 'ROAD',
        type: 'Highway',
        description: 'Greenfield 109 km access-controlled expressway linking Ahmedabad to Dholera Special Investment Region.',
        ownerOrganization: 'Gujarat Industrial Development Corporation',
        department: 'Roads & Highways Department',
        location: {
          address: 'Bavla - Dholera Expressway Section',
          city: 'Bavla',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '382220',
          latitude: 22.8361,
          longitude: 72.3614,
        },
        physicalDetails: {
          length: '45 km (Sec 1)',
          size: '4-Lane Expandable to 8',
          material: 'Dry Lean Concrete & PQC Top Layer',
          manufacturer: 'Tata Projects Ltd',
          serialNumber: 'GIDC-DHL-EXPR-1',
        },
        lifecycle: {
          status: 'UNDER_CONSTRUCTION',
          constructionStartDate: new Date('2024-03-01'),
          usefulLife: 30,
        },
        condition: {
          score: 85,
          rating: 'GOOD',
          lastInspectionDate: new Date('2026-08-05'),
          nextInspectionDate: new Date('2026-11-05'),
        },
        financial: {
          acquisitionCost: 3500000000,
          constructionCost: 2800000000,
          currentValue: 3500000000,
          maintenanceCost: 0,
          totalLifecycleCost: 6300000000,
        },
        criticality: 'CRITICAL',
        tags: ['Expressway', 'Dholera SIR', 'Greenfield'],
      },
      {
        assetCode: 'BLDG-2026-0003',
        name: 'Old Kalupur Public Distribution Warehouse #8',
        catCode: 'BLDG',
        type: 'Warehouse',
        description: 'Colonial-era masonry and timber roof civil supplies depot.',
        ownerOrganization: 'Civil Supplies & Consumer Affairs',
        department: 'Logistics & Warehousing',
        location: {
          address: 'Kalupur Kot Vista, Old City',
          city: 'Ahmedabad',
          district: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380002',
          latitude: 23.0298,
          longitude: 72.5982,
        },
        physicalDetails: {
          size: '4,500 sq m',
          capacity: '12,000 MT Grain',
          material: 'Brick Masonry & Corrugated Iron Sheet',
          serialNumber: 'WH-KLP-1952',
        },
        lifecycle: {
          status: 'DECOMMISSIONED',
          commissioningDate: new Date('1965-03-10'),
          usefulLife: 50, // 61 years old! Decommissioned
        },
        condition: {
          score: 18,
          rating: 'CRITICAL',
          lastInspectionDate: new Date('2026-01-10'),
          nextInspectionDate: null,
        },
        financial: {
          acquisitionCost: 15000000,
          constructionCost: 12000000,
          currentValue: 2000000,
          maintenanceCost: 18000000,
          totalLifecycleCost: 45000000,
        },
        criticality: 'LOW',
        tags: ['Decommissioned', 'Old City', 'Replacement Candidate'],
      },
      {
        assetCode: 'WTR-2026-0003',
        name: 'Jaspur Raw Water Intake & Gravity Main',
        catCode: 'WTR',
        type: 'Pipeline',
        description: '2,400mm MS pipeline carrying untreated raw water from Narmada Main Canal to Gandhinagar and North Ahmedabad.',
        ownerOrganization: 'Gujarat Water Infrastructure Ltd (GWIL)',
        department: 'Bulk Water Transmission',
        location: {
          address: 'Jaspur Pumping Station, Kalol Highway',
          city: 'Kalol',
          district: 'Gandhinagar',
          state: 'Gujarat',
          pincode: '382721',
          latitude: 23.1812,
          longitude: 72.5125,
        },
        physicalDetails: {
          length: '26 km',
          size: '2,400 mm Dia',
          capacity: '800 MLD',
          material: 'Mild Steel with Internal Mortar Lining and External Polyurethane Coating',
          manufacturer: 'Welspun Corp Pipe Division',
          serialNumber: 'GWIL-JSP-RAW-24',
        },
        lifecycle: {
          status: 'OPERATIONAL',
          commissioningDate: new Date('2020-02-14'),
          usefulLife: 40,
        },
        condition: {
          score: 87,
          rating: 'GOOD',
          lastInspectionDate: new Date('2026-07-01'),
          nextInspectionDate: new Date('2027-01-01'),
        },
        financial: {
          acquisitionCost: 1450000000,
          constructionCost: 1300000000,
          currentValue: 1380000000,
          maintenanceCost: 22000000,
          totalLifecycleCost: 2772000000,
        },
        criticality: 'CRITICAL',
        tags: ['Bulk Pipeline', 'Transmission', 'GWIL', 'Narmada Main'],
      },
    ];

    const createdAssets = [];
    for (const raw of rawAssets) {
      const catId = catMap[raw.catCode];
      const qrCode = await generateAssetQRCode(raw.assetCode, clientUrl);
      const risk = calculateRisk({
        condition: raw.condition,
        lifecycle: raw.lifecycle,
        criticality: raw.criticality,
      });

      const assetDoc = await Asset.create({
        ...raw,
        categoryId: catId,
        managerId: assetManager._id,
        qrCode,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        createdBy: adminUser._id,
        updatedBy: adminUser._id,
      });

      createdAssets.push(assetDoc);

      // Seed initial lifecycle event
      await LifecycleEvent.create({
        assetId: assetDoc._id,
        previousStatus: 'PLANNED',
        newStatus: assetDoc.lifecycle.status,
        reason: 'Asset initial registration and commissioning',
        remarks: 'Recorded during baseline inventory setup',
        changedBy: adminUser._id,
      });
    }

    console.log('[Seed] Seeding 10 Realistic Inspections...');
    // 10 Inspections
    const inspectionData = [
      {
        asset: createdAssets[0], // Road-0001
        type: 'Routine',
        score: 88,
        rating: 'GOOD',
        obs: 'Road surface is uniform with minor hairline asphalt cracks on lane 3 shoulder. Drainage inlets clear.',
        rec: 'Schedule micro-surfacing on lane 3 in next quarterly maintenance cycle.',
        nextDate: new Date('2026-12-10'),
      },
      {
        asset: createdAssets[1], // Ellis Bridge
        type: 'Structural',
        score: 64,
        rating: 'FAIR',
        obs: 'Superstructure steel shows surface oxidation at pier 4 bearing plates. Expansion joints show debris compaction.',
        rec: 'Sandblast and apply epoxy primer coat on pier 4 steelwork. Clear expansion joint elastomeric seals.',
        nextDate: new Date('2026-11-01'),
      },
      {
        asset: createdAssets[2], // Civic Secretariat
        type: 'Safety',
        score: 94,
        rating: 'EXCELLENT',
        obs: 'Fire suppression risers, emergency backup generators, and stairwell pressurization tested with zero faults.',
        rec: 'Maintain routine weekly test runs of emergency generators.',
        nextDate: new Date('2027-05-18'),
      },
      {
        asset: createdAssets[3], // Kotarpur WTP
        type: 'Annual',
        score: 82,
        rating: 'GOOD',
        obs: 'Flocculation paddles operating within vibration limits. Ozonation generator efficiency at 98.4%.',
        rec: 'Calibrate turbidity sensor heads on Filter Bed 8.',
        nextDate: new Date('2026-10-12'),
      },
      {
        asset: createdAssets[4], // East Drainage Trunk (Poor)
        type: 'Emergency',
        score: 42,
        rating: 'POOR',
        obs: 'Heavy silt accumulation restricting 35% hydraulic cross-section near Odhav industrial inlet. Minor scouring observed.',
        rec: 'Deploy high-velocity suction super-sucker trucks immediately to desilt full 8.4 km section before monsoon.',
        nextDate: new Date('2026-09-15'),
      },
      {
        asset: createdAssets[5], // Substation
        type: 'Routine',
        score: 91,
        rating: 'EXCELLENT',
        obs: 'SF6 gas pressure levels nominal at 6.2 bar. Thermographic infrared scan revealed no hot spots on 220kV busbars.',
        rec: 'Continue bi-monthly automated telemetry monitoring.',
        nextDate: new Date('2026-10-10'),
      },
      {
        asset: createdAssets[6], // Ranip Hub
        type: 'Safety',
        score: 86,
        rating: 'GOOD',
        obs: 'Passenger escalators and fire egress paths fully functional. Slip-resistant tactile tiles in order.',
        rec: 'Replace 4 worn rubber treads on escalator #2.',
        nextDate: new Date('2026-12-25'),
      },
      {
        asset: createdAssets[7], // Pump #4
        type: 'Post-Maintenance',
        score: 76,
        rating: 'GOOD',
        obs: 'Mechanical seal replaced and vibration levels dropped from 4.8 mm/s to 1.6 mm/s. Bearing temperatures stabilized at 48°C.',
        rec: 'Inspect oil viscosity after 500 operating hours.',
        nextDate: new Date('2026-11-30'),
      },
      {
        asset: createdAssets[14], // Vasna Barrage (Critical/Poor)
        type: 'Structural',
        score: 48,
        rating: 'POOR',
        obs: 'Significant cavitation pitting on Radial Gate 12 skin plate. Wire rope hoists show 8% diameter reduction from wear.',
        rec: 'Emergency refurbishment of Gate 12 hoist ropes and sandblasting/re-facing required. Long-term replacement plan mandated.',
        nextDate: new Date('2026-10-05'),
      },
      {
        asset: createdAssets[18], // Old Kalupur Warehouse (Decommissioned)
        type: 'Structural',
        score: 18,
        rating: 'CRITICAL',
        obs: 'Severe timber dry rot and active wall settlement cracks over 12mm wide along north facade. Unsafe for human occupancy.',
        rec: 'Structure condemned. Complete demolition and site clearance recommended.',
        nextDate: null,
      },
    ];

    for (let i = 0; i < inspectionData.length; i++) {
      const item = inspectionData[i];
      const inspId = `INSP-2026-${String(i + 1).padStart(4, '0')}`;
      await Inspection.create({
        inspectionId: inspId,
        assetId: item.asset._id,
        inspectorId: inspector._id,
        inspectionDate: new Date(Date.now() - (10 - i) * 7 * 24 * 60 * 60 * 1000),
        inspectionType: item.type,
        conditionScore: item.score,
        conditionRating: item.rating,
        structuralCondition: { score: item.score, notes: 'Evaluated on site' },
        operationalCondition: { score: item.score + 2, notes: 'Operational parameters checked' },
        safetyCondition: { score: item.score - 1, notes: 'Standard safety compliance' },
        observations: item.obs,
        recommendations: item.rec,
        nextInspectionDate: item.nextDate,
      });
    }

    console.log('[Seed] Seeding 10 Maintenance Requests & 5 Work Orders...');
    const maintenanceData = [
      {
        asset: createdAssets[4], // East Drainage
        problem: 'Silt blockage and industrial effluent sludge in trunk conduit',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        type: 'Emergency',
        estCost: 1850000,
      },
      {
        asset: createdAssets[1], // Ellis Bridge
        problem: 'Corrosion at bearing plates and expansion joint cleaning',
        priority: 'HIGH',
        status: 'ASSIGNED',
        type: 'Corrective',
        estCost: 950000,
      },
      {
        asset: createdAssets[7], // Pump #4
        problem: 'Mechanical seal replacement and shaft realignment',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        type: 'Corrective',
        estCost: 450000,
        actualCost: 420000,
      },
      {
        asset: createdAssets[14], // Vasna Barrage
        problem: 'Hydraulic hoist wire rope wear on Radial Gate #12',
        priority: 'CRITICAL',
        status: 'OPEN',
        type: 'Corrective',
        estCost: 2400000,
      },
      {
        asset: createdAssets[0], // Road-0001
        problem: 'Bitumen resurfacing and shoulder crack sealing (km 4 to 6)',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        type: 'Preventive',
        estCost: 1200000,
        actualCost: 1150000,
      },
      {
        asset: createdAssets[15], // Smart Lighting
        problem: 'CMS Controller telemetry communication drop in Sector 3',
        priority: 'LOW',
        status: 'COMPLETED',
        type: 'Routine',
        estCost: 85000,
        actualCost: 75000,
      },
      {
        asset: createdAssets[13], // Vastrapur ESR
        problem: 'High-level float sensor failure causing overflow alert',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        type: 'Emergency',
        estCost: 140000,
      },
      {
        asset: createdAssets[8], // Solar Grid
        problem: 'Inverter Bank C harmonic filter replacement',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        type: 'Preventive',
        estCost: 320000,
        actualCost: 310000,
      },
      {
        asset: createdAssets[6], // Ranip Hub
        problem: 'HVAC chiller compressor bearing vibration in passenger concourse',
        priority: 'MEDIUM',
        status: 'OPEN',
        type: 'Corrective',
        estCost: 280000,
      },
      {
        asset: createdAssets[16], // Dewatering Pump
        problem: 'Routine 250-hour diesel engine lube and filter change',
        priority: 'LOW',
        status: 'COMPLETED',
        type: 'Routine',
        estCost: 45000,
        actualCost: 42000,
      },
    ];

    const createdRequests = [];
    for (let i = 0; i < maintenanceData.length; i++) {
      const item = maintenanceData[i];
      const reqId = `MR-2026-${String(i + 1).padStart(4, '0')}`;
      const mr = await MaintenanceRequest.create({
        requestId: reqId,
        assetId: item.asset._id,
        requestedBy: engineer._id,
        requestDate: new Date(Date.now() - (15 - i) * 3 * 24 * 60 * 60 * 1000),
        problem: item.problem,
        description: `Field maintenance ticket logged for ${item.asset.assetCode} regarding ${item.problem}.`,
        priority: item.priority,
        status: item.status,
        maintenanceType: item.type,
        assignedTeam: 'Civil & Electro-Mechanical Maintenance Wing',
        assignedEngineer: engineer._id,
        estimatedCost: item.estCost,
        actualCost: item.actualCost || 0,
        scheduledDate: new Date(Date.now() + (i % 2 === 0 ? -2 : 5) * 24 * 60 * 60 * 1000), // Some overdue
        completionDate: item.status === 'COMPLETED' ? new Date() : null,
      });
      createdRequests.push(mr);
    }

    // 5 Work Orders corresponding to requests
    for (let i = 0; i < 5; i++) {
      const mr = createdRequests[i];
      const woId = `WO-2026-${String(i + 1).padStart(4, '0')}`;
      const lCost = Math.round(mr.estimatedCost * 0.4);
      const mCost = Math.round(mr.estimatedCost * 0.5);
      const oCost = Math.round(mr.estimatedCost * 0.1);
      const total = lCost + mCost + oCost;

      await WorkOrder.create({
        workOrderId: woId,
        assetId: mr.assetId,
        maintenanceRequestId: mr._id,
        maintenanceType: mr.maintenanceType,
        assignedTeam: 'Rapid Response Maintenance Squad',
        assignedEngineer: engineer._id,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expectedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        actualCompletionDate: mr.status === 'COMPLETED' ? new Date() : null,
        laborCost: lCost,
        materialCost: mCost,
        otherCost: oCost,
        totalCost: total,
        workDescription: `Execution order for ${mr.problem}`,
        status: mr.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        completionNotes: mr.status === 'COMPLETED' ? 'Task completed according to municipal engineering standards.' : '',
      });
    }

    console.log('[Seed] Seeding Procurements...');
    // Seed 4 procurements
    await Procurement.create([
      {
        procurementId: 'PROC-2026-0001',
        assetId: createdAssets[5]._id, // Substation
        vendorId: vendors[2]._id, // Siemens
        purchaseOrder: 'PO-GETCO-2020-098',
        contractNumber: 'CNT-220KV-PMR-01',
        procurementDate: new Date('2020-04-12'),
        purchaseCost: 680000000,
        warrantyPeriod: 60,
        warrantyExpiry: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Expiring in 20 days!
        procurementStatus: 'WARRANTY_ACTIVE',
      },
      {
        procurementId: 'PROC-2026-0002',
        assetId: createdAssets[7]._id, // Pump
        vendorId: vendors[1]._id, // Kirloskar
        purchaseOrder: 'PO-AMC-WTR-2019-441',
        contractNumber: 'CNT-KTP-PMP-04',
        procurementDate: new Date('2019-06-15'),
        purchaseCost: 48000000,
        warrantyPeriod: 36,
        warrantyExpiry: new Date('2022-06-15'),
        procurementStatus: 'WARRANTY_EXPIRED',
      },
      {
        procurementId: 'PROC-2026-0003',
        assetId: createdAssets[15]._id, // Smart Light
        vendorId: vendors[4]._id, // Philips
        purchaseOrder: 'PO-AUDA-LED-2022-11',
        contractNumber: 'CNT-SGH-LGT-3200',
        procurementDate: new Date('2022-03-01'),
        purchaseCost: 95000000,
        warrantyPeriod: 60,
        warrantyExpiry: new Date('2027-03-01'),
        procurementStatus: 'WARRANTY_ACTIVE',
      },
      {
        procurementId: 'PROC-2026-0004',
        assetId: createdAssets[8]._id, // Solar
        vendorId: vendors[0]._id, // L&T
        purchaseOrder: 'PO-SSNNL-SLR-2022-05',
        contractNumber: 'CNT-NRM-CANAL-10MW',
        procurementDate: new Date('2021-11-10'),
        purchaseCost: 520000000,
        warrantyPeriod: 120,
        warrantyExpiry: new Date('2031-11-10'),
        procurementStatus: 'WARRANTY_ACTIVE',
      },
    ]);

    console.log('[Seed] Seeding 10 Realistic Notifications...');
    await Notification.create([
      {
        title: 'Critical Asset Condition Warning',
        message: 'East Ahmedabad Trunk Stormwater Conduit (DRN-2026-0001) is in POOR condition (Score: 42/100). Emergency desilting recommended.',
        type: 'CRITICAL_ASSET',
        relatedAsset: createdAssets[4]._id,
        isRead: false,
      },
      {
        title: 'Inspection Overdue Alert',
        message: 'Vastrapur Elevated Storage Reservoir (WTR-2026-0002) routine inspection was due on 18 August 2026.',
        type: 'INSPECTION_DUE',
        relatedAsset: createdAssets[13]._id,
        isRead: false,
      },
      {
        title: 'Urgent Maintenance Ticket Assigned',
        message: 'Work Order WO-2026-0001 for East Ahmedabad Conduit has been assigned to Rapid Response Maintenance Squad.',
        type: 'WORK_ORDER',
        relatedAsset: createdAssets[4]._id,
        isRead: false,
      },
      {
        title: 'Equipment Warranty Expiring in 20 Days',
        message: 'Warranty for Prahladnagar 220/66 kV GIS Substation (ELEC-2026-0001) supplied by Siemens will expire next month.',
        type: 'WARRANTY_EXPIRING',
        relatedAsset: createdAssets[5]._id,
        isRead: true,
      },
      {
        title: 'End-of-Life Replacement Required',
        message: 'Vasna Barrage Sluice Gates (DRN-2026-0002) has reached 28 years of service against 30 years useful life. Initiate replacement planning.',
        type: 'END_OF_LIFE',
        relatedAsset: createdAssets[14]._id,
        isRead: false,
      },
      {
        title: 'Work Order WO-2026-0003 Completed',
        message: 'Maintenance seal overhaul for Standby Turbine Pump #4 successfully completed. Asset return to normal operating status.',
        type: 'WORK_ORDER',
        relatedAsset: createdAssets[7]._id,
        isRead: true,
      },
      {
        title: 'Inspection Completed: Ellis Bridge',
        message: 'Structural inspection INSP-2026-0002 completed by Sunita Mehta. Condition rating assigned: FAIR (64/100).',
        type: 'INSPECTION_DUE',
        relatedAsset: createdAssets[1]._id,
        isRead: true,
      },
      {
        title: 'Lifecycle Status Update',
        message: 'Dholera SIR Express Highway Phase-1 (ROAD-2026-0003) progressed to UNDER_CONSTRUCTION status.',
        type: 'LIFECYCLE_CHANGE',
        relatedAsset: createdAssets[17]._id,
        isRead: true,
      },
      {
        title: 'System Audit Record',
        message: 'Baseline system seed initialized with 20 municipal infrastructure assets across 10 categories.',
        type: 'SYSTEM',
        isRead: true,
      },
      {
        title: 'New Maintenance Request Logged',
        message: 'MR-2026-0004: Radial Gate #12 hoist wire wear logged by Field Engineer Vikram Desai.',
        type: 'MAINTENANCE_DUE',
        relatedAsset: createdAssets[14]._id,
        isRead: false,
      },
    ]);

    console.log('[Seed] Database successfully seeded with 100% production quality infrastructure data!');
    return true;
  } catch (err) {
    console.error('[Seed] Error seeding data:', err);
    throw err;
  }
};

if (require.main === module) {
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    await seedAll();
    console.log('[Seed] Process completed. Exiting.');
    process.exit(0);
  });
}

module.exports = seedAll;
