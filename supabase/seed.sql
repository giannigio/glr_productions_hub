-- Demo admin profile (associate with an auth user that has the same UUID)
insert into public.profiles (user_id, email, full_name, system_role)
values (
  '11111111-1111-1111-1111-111111111111',
  'admin@glr.it',
  'Admin Demo',
  'ADMIN'
)
on conflict (user_id) do nothing;

-- Base settings
insert into public.app_settings (id, payload)
values (
  '00000000-0000-0000-0000-000000000001',
  '{
    "companyName": "GLR Productions Srl",
    "pIva": "12345678901",
    "address": "Via Roma 1, Milano",
    "bankName": "Intesa Sanpaolo",
    "iban": "IT0000000000000000000000000",
    "logoUrl": "",
    "defaultDailyIndemnity": 50,
    "kmCost": 0.5,
    "defaultVatRate": 22,
    "crewRoles": ["Project Manager", "Tecnico Audio", "Operatore Luci"],
    "permissions": {
      "MANAGER": {"canViewDashboard": true, "canViewJobs": true, "canManageJobs": true, "canDeleteJobs": false},
      "TECH": {"canViewDashboard": true, "canViewJobs": true, "canManageJobs": false, "canDeleteJobs": false}
    }
  }'::jsonb
)
on conflict (id) do nothing;

-- Crew
insert into public.crew_members (id, payload)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '{
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "Admin Demo",
      "type": "Interno",
      "roles": ["Project Manager"],
      "dailyRate": 0,
      "email": "admin@glr.it",
      "accessRole": "ADMIN",
      "phone": "3339999999",
      "absences": [],
      "expenses": []
    }'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '{
      "id": "22222222-2222-2222-2222-222222222222",
      "name": "Luca Bianchi",
      "type": "Interno",
      "roles": ["Tecnico Audio"],
      "dailyRate": 0,
      "phone": "3338888888",
      "accessRole": "TECH",
      "absences": [],
      "expenses": []
    }'::jsonb
  )
  on conflict (id) do nothing;

-- Locations
insert into public.locations (id, payload)
values (
  '33333333-3333-3333-3333-333333333333',
  '{
    "id": "33333333-3333-3333-3333-333333333333",
    "name": "Teatro Nazionale",
    "address": "Piazza Piemonte 12, Milano",
    "hallSizeMQ": 500,
    "mapsLink": "",
    "isZtl": true,
    "contactName": "Mario Rossi",
    "contactPhone": "3331234567",
    "accessHours": "08:00 - 20:00",
    "power": {"hasCivil": false, "hasIndustrial": true, "industrialSockets": ["32A", "63A"], "requiresGenerator": false, "distanceFromPanel": 20, "notes": ""},
    "network": {"isUnavailable": false, "hasWired": true, "hasWifi": true, "hasWallLan": true, "wallLanDistance": 15, "addressing": "DHCP", "staticDetails": "", "firewallProxyNotes": ""},
    "logistics": {"loadFloor": "Piano Terra", "hasParking": true, "hasLift": false, "stairsDetails": "", "hasEmptyStorage": true, "emptyStorageNotes": ""},
    "equipment": {"audio": {"present": true, "hasPA": true, "paNotes": "Impianto residente", "hasMics": false, "micsNotes": "", "hasMixerOuts": true, "mixerNotes": "Left/Right XLR"}, "video": {"present": false, "hasTV": false, "hasProjector": false, "hasLedwall": false, "hasMonitorGobo": false, "signals": [], "notes": ""}, "hasLights": true, "lightsNotes": "Americana frontale", "hasPerimeterSockets": true},
    "generalSurveyNotes": "Scaricare dal retro"
  }'::jsonb
) on conflict (id) do nothing;

-- Inventory
insert into public.inventory_items (id, payload)
values
  ('44444444-4444-4444-4444-444444444441', '{"id": "44444444-4444-4444-4444-444444444441", "name": "Shure SM58", "category": "Audio", "type": "Microfono", "quantityOwned": 10, "serialNumber": "SN001", "status": "Operativo"}'::jsonb),
  ('44444444-4444-4444-4444-444444444442', '{"id": "44444444-4444-4444-4444-444444444442", "name": "Yamaha QL1", "category": "Audio", "type": "Mixer", "quantityOwned": 2, "serialNumber": "SN002", "status": "Operativo"}'::jsonb)
on conflict (id) do nothing;

-- Standard material lists
insert into public.standard_material_lists (id, payload)
values (
  '55555555-5555-5555-5555-555555555555',
  '{
    "id": "55555555-5555-5555-5555-555555555555",
    "name": "Kit Conferenza Base",
    "labels": ["Audio"],
    "items": [
      {"id": "sl1", "inventoryId": "44444444-4444-4444-4444-444444444441", "name": "Shure SM58", "category": "Audio", "type": "Microfono", "quantity": 4, "isExternal": false},
      {"id": "sl2", "inventoryId": "44444444-4444-4444-4444-444444444441", "name": "Cavo XLR 10m", "category": "Cavi", "type": "XLR", "quantity": 10, "isExternal": false}
    ]
  }'::jsonb
) on conflict (id) do nothing;

-- Jobs
insert into public.jobs (id, payload)
values (
  '66666666-6666-6666-6666-666666666666',
  '{
    "id": "66666666-6666-6666-6666-666666666666",
    "title": "Convention Aziendale Alpha",
    "client": "Alpha Corp",
    "location": "Teatro Nazionale",
    "locationId": "33333333-3333-3333-3333-333333333333",
    "startDate": "2024-04-20",
    "endDate": "2024-04-21",
    "status": "Confermato",
    "description": "Convention annuale con streaming",
    "departments": ["Audio", "Video"],
    "isAwayJob": false,
    "isSubcontracted": false,
    "outfitNoLogo": false,
    "phases": [
      {"id": "p1", "name": "Allestimento", "start": "2024-04-20T08:00:00.000Z", "end": "2024-04-20T12:00:00.000Z"}
    ],
    "vehicles": [
      {"id": "v1", "type": "Ducato", "quantity": 2, "isRental": false}
    ],
    "materialList": [
      {"id": "m1", "inventoryId": "44444444-4444-4444-4444-444444444441", "name": "Shure SM58", "category": "Audio", "type": "Microfono", "quantity": 2, "isExternal": false}
    ],
    "assignedCrew": ["22222222-2222-2222-2222-222222222222"],
    "notes": "",
    "extraCharges": 250,
    "totalInvoiced": 8500
  }'::jsonb
) on conflict (id) do nothing;

-- Rentals
insert into public.rentals (id, payload)
values (
  '77777777-7777-7777-7777-777777777777',
  '{
    "id": "77777777-7777-7777-7777-777777777777",
    "status": "Confermato",
    "client": "Service Partner SRL",
    "contactName": "Giovanni Muciaccia",
    "contactPhone": "3330000000",
    "pickupDate": "2024-04-20T09:00:00.000Z",
    "returnDate": "2024-04-22T18:00:00.000Z",
    "deliveryMethod": "RITIRO",
    "items": [
      {"id": "ri1", "inventoryId": "44444444-4444-4444-4444-444444444441", "name": "Par LED", "category": "Luci", "type": "Faro", "quantity": 4, "isExternal": false}
    ],
    "notes": "Pagamento al ritiro",
    "totalPrice": 150
  }'::jsonb
) on conflict (id) do nothing;

-- Notifications
insert into public.notifications (id, payload)
values (
  '88888888-8888-8888-8888-888888888888',
  '{
    "id": "88888888-8888-8888-8888-888888888888",
    "type": "INFO",
    "title": "Demo pronta",
    "message": "Profilo demo creato con supabase seed",
    "timestamp": "2024-04-20T09:00:00.000Z",
    "read": false
  }'::jsonb
) on conflict (id) do nothing;
