import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Nepal cities and locations
const nepalLocations = [
  { city: 'Kathmandu', lat: 27.7172, lng: 85.3240 },
  { city: 'Pokhara', lat: 28.2096, lng: 83.9856 },
  { city: 'Lalitpur', lat: 27.6667, lng: 85.3167 },
  { city: 'Bhaktapur', lat: 27.6710, lng: 85.4298 },
  { city: 'Biratnagar', lat: 26.4525, lng: 87.2718 },
];

// Kathmandu area coordinates for routes
const kathmanduAreas = [
  { name: 'Ratna Park', lat: 27.7024, lng: 85.3150 },
  { name: 'New Road', lat: 27.7025, lng: 85.3100 },
  { name: 'Thamel', lat: 27.7145, lng: 85.3120 },
  { name: 'Balaju', lat: 27.7350, lng: 85.3000 },
  { name: 'Koteshwor', lat: 27.6770, lng: 85.3480 },
  { name: 'Kalanki', lat: 27.6950, lng: 85.2800 },
  { name: 'Chabahil', lat: 27.7200, lng: 85.3450 },
  { name: 'Baneshwor', lat: 27.6950, lng: 85.3350 },
  { name: 'Maharajgunj', lat: 27.7350, lng: 85.3300 },
  { name: 'Lagankhel', lat: 27.6650, lng: 85.3250 },
  { name: 'Satdobato', lat: 27.6500, lng: 85.3350 },
  { name: 'Bhaisepati', lat: 27.6400, lng: 85.3200 },
];

// Nepali names for realistic demo
const nepaliNames = {
  male: ['Ram', 'Shyam', 'Hari', 'Krishna', 'Bikash', 'Suresh', 'Rajesh', 'Dinesh', 'Prakash', 'Santosh'],
  female: ['Sita', 'Gita', 'Rita', 'Anita', 'Sunita', 'Sabita', 'Kamala', 'Radha', 'Laxmi', 'Saraswati'],
  surnames: ['Sharma', 'Shrestha', 'Tamang', 'Gurung', 'Rai', 'Limbu', 'Thapa', 'Magar', 'Karki', 'Adhikari']
};

function generateNepalPhone(): string {
  const prefixes = ['980', '981', '982', '984', '985', '986'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${number}`;
}

function generateName(gender: 'male' | 'female'): string {
  const firstName = nepaliNames[gender][Math.floor(Math.random() * nepaliNames[gender].length)];
  const surname = nepaliNames.surnames[Math.floor(Math.random() * nepaliNames.surnames.length)];
  return `${firstName} ${surname}`;
}

function generateLicenseNumber(): string {
  const district = Math.floor(10 + Math.random() * 68); // Nepal has 77 districts
  const office = Math.floor(1 + Math.random() * 9);
  const year = Math.floor(2018 + Math.random() * 6);
  const serial = Math.floor(10000 + Math.random() * 90000);
  return `${String(district).padStart(2, '0')}-${String(office).padStart(2, '0')}-${year}-${String(serial).padStart(5, '0')}`;
}

async function main() {
  console.log('🚀 Starting SPTM Demo Database Seeding...\n');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    try {
      await prisma.tapSession.deleteMany();
      await prisma.walletTransaction.deleteMany();
      await prisma.wallet.deleteMany();
      await prisma.discountApplication.deleteMany();
      await prisma.trip.deleteMany();
      await prisma.incidentReport.deleteMany();
      await prisma.driverLocation.deleteMany();
      await prisma.busAssignment.deleteMany();
      await prisma.routeStop.deleteMany();
      await prisma.route.deleteMany();
      await prisma.bus.deleteMany();
      await prisma.driverProfile.deleteMany();
      await prisma.driverLicense.deleteMany();
      await prisma.user.deleteMany();
      await prisma.organization.deleteMany();
      await prisma.admin.deleteMany();
      await prisma.superAdmin.deleteMany();
      console.log('✅ Existing data cleared\n');
    } catch (error) {
      console.log('⚠️  Some tables might not exist yet, continuing...\n');
    }

    // 1. Create or Update Super Admin
    console.log('👑 Creating Super Admin...');
    const superAdmin = await prisma.superAdmin.upsert({
      where: { email: 'superadmin@sptm.com' },
      update: {},
      create: {
        email: 'superadmin@sptm.com',
        password: await bcrypt.hash('SuperAdmin123!', 12),
        name: 'System Administrator',
        createdBy: 'SYSTEM'
      }
    });
    console.log(`✅ Super Admin ready: ${superAdmin.email}\n`);

    // 2. Create or Update Admin
    console.log('👨‍💼 Creating Admin...');
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@sptm.com' },
      update: {},
      create: {
        email: 'admin@sptm.com',
        password: await bcrypt.hash('Admin123!', 12),
        name: 'SPTM Administrator',
        phone: '+977' + generateNepalPhone(),
        createdBy: superAdmin.id
      }
    });
    console.log(`✅ Admin ready: ${admin.email}\n`);

    // 3. Create Organizations
    console.log('🏢 Creating Organizations...');
    const organizations = [];
    const orgNames = [
      'Kathmandu Valley Transport',
      'Pokhara City Bus Service',
      'Nepal Public Transport',
      'Valley Express Lines'
    ];

    for (let i = 0; i < orgNames.length; i++) {
      const org = await prisma.organization.create({
        data: {
          email: `org${i + 1}@sptm.com`,
          password: await bcrypt.hash('Org123!', 12),
          name: orgNames[i],
          phone: '+977' + generateNepalPhone(),
          address: `${kathmanduAreas[i].name}, Kathmandu, Nepal`,
          licenseNumber: `ORG-2024-${String(i + 1).padStart(3, '0')}`,
          createdBy: admin.id
        }
      });
      organizations.push(org);
      console.log(`  ✅ ${org.name}`);
    }
    console.log(`✅ Created ${organizations.length} organizations\n`);

    // 4. Create Driver Licenses (50 licenses)
    console.log('📜 Creating Driver Licenses...');
    const licenses = [];
    for (let i = 0; i < 50; i++) {
      const license = await prisma.driverLicense.create({
        data: {
          licenseNumber: generateLicenseNumber(),
          issuedDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
          expiryDate: new Date(2026 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 1),
          licenseType: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          isValid: true
        }
      });
      licenses.push(license);
    }
    console.log(`✅ Created ${licenses.length} driver licenses\n`);

    // 5. Create Drivers (30 drivers)
    console.log('🚗 Creating Drivers...');
    const drivers = [];
    for (let i = 0; i < 30; i++) {
      const org = organizations[Math.floor(Math.random() * organizations.length)];
      const phone = generateNepalPhone();
      
      const driver = await prisma.user.create({
        data: {
          phone: '+977' + phone,
          name: generateName('male'),
          role: 'DRIVER',
          isPhoneVerified: true,
          organizationId: org.id
        }
      });

      // Create driver profile
      const license = licenses[i];
      await prisma.driverProfile.create({
        data: {
          userId: driver.id,
          licenseNumber: license.licenseNumber,
          licenseExpiry: license.expiryDate,
          vehicleType: ['BUS', 'MINIBUS', 'MICROBUS'][Math.floor(Math.random() * 3)],
          experience: Math.floor(2 + Math.random() * 15),
          status: i < 25 ? 'APPROVED' : 'PENDING',
          organizationId: org.id
        }
      });

      drivers.push(driver);
    }
    console.log(`✅ Created ${drivers.length} drivers\n`);

    // 6. Create Passengers (100 passengers)
    console.log('👥 Creating Passengers...');
    const passengers = [];
    for (let i = 0; i < 100; i++) {
      const phone = generateNepalPhone();
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      
      const passenger = await prisma.user.create({
        data: {
          phone: '+977' + phone,
          name: generateName(gender),
          role: 'PASSENGER',
          isPhoneVerified: true
        }
      });

      // Create wallet for passenger
      await prisma.wallet.create({
        data: {
          userId: passenger.id,
          balance: Math.floor(100 + Math.random() * 2000) // Random balance 100-2100
        }
      });

      passengers.push(passenger);
    }
    console.log(`✅ Created ${passengers.length} passengers with wallets\n`);

    // 7. Create Buses (40 buses)
    console.log('🚌 Creating Buses...');
    const buses = [];
    const vehicleTypes = ['STANDARD', 'MINIBUS', 'ELECTRIC', 'AC_BUS'];
    
    for (let i = 0; i < 40; i++) {
      const org = organizations[Math.floor(Math.random() * organizations.length)];
      const bus = await prisma.bus.create({
        data: {
          plateNumber: `BA ${Math.floor(10 + Math.random() * 90)} PA ${Math.floor(1000 + Math.random() * 9000)}`,
          model: ['Tata Starbus', 'Ashok Leyland', 'Eicher Skyline', 'BYD Electric'][Math.floor(Math.random() * 4)],
          capacity: [30, 40, 50, 60][Math.floor(Math.random() * 4)],
          type: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
          status: i < 35 ? 'ACTIVE' : 'MAINTENANCE',
          organizationId: org.id,
          currentLatitude: 27.7 + (Math.random() - 0.5) * 0.1,
          currentLongitude: 85.3 + (Math.random() - 0.5) * 0.1,
          lastLocationUpdate: new Date()
        }
      });
      buses.push(bus);
    }
    console.log(`✅ Created ${buses.length} buses\n`);

    // 8. Create Routes (15 routes)
    console.log('🗺️  Creating Routes...');
    const routes = [];
    const routeData = [
      { name: 'Ratna Park - Koteshwor', number: '1', start: 0, end: 4, stops: [0, 7, 4] },
      { name: 'Kalanki - Chabahil', number: '2', start: 5, end: 6, stops: [5, 0, 7, 6] },
      { name: 'Balaju - Lagankhel', number: '3', start: 3, end: 9, stops: [3, 0, 7, 9] },
      { name: 'Thamel - Satdobato', number: '4', start: 2, end: 10, stops: [2, 0, 7, 9, 10] },
      { name: 'Maharajgunj - Bhaisepati', number: '5', start: 8, end: 11, stops: [8, 0, 7, 9, 10, 11] },
      { name: 'New Road - Baneshwor', number: '6', start: 1, end: 7, stops: [1, 0, 7] },
      { name: 'Ratna Park - Balaju', number: '7', start: 0, end: 3, stops: [0, 3] },
      { name: 'Koteshwor - Kalanki', number: '8', start: 4, end: 5, stops: [4, 7, 0, 5] },
      { name: 'Chabahil - Lagankhel', number: '9', start: 6, end: 9, stops: [6, 7, 0, 9] },
      { name: 'Thamel - Maharajgunj', number: '10', start: 2, end: 8, stops: [2, 8] },
    ];

    for (const rd of routeData) {
      const org = organizations[Math.floor(Math.random() * organizations.length)];
      const startPoint = kathmanduAreas[rd.start];
      const endPoint = kathmanduAreas[rd.end];
      
      const route = await prisma.route.create({
        data: {
          name: rd.name,
          routeNumber: rd.number,
          startPoint: startPoint.name,
          endPoint: endPoint.name,
          distance: Math.floor(5 + Math.random() * 20), // 5-25 km
          estimatedDuration: Math.floor(20 + Math.random() * 60), // 20-80 minutes
          basePrice: Math.floor(20 + Math.random() * 50), // Rs. 20-70
          isActive: true,
          organizationId: org.id
        }
      });

      // Create route stops
      for (let j = 0; j < rd.stops.length; j++) {
        const stopArea = kathmanduAreas[rd.stops[j]];
        await prisma.routeStop.create({
          data: {
            routeId: route.id,
            stopName: stopArea.name,
            stopOrder: j + 1,
            latitude: stopArea.lat,
            longitude: stopArea.lng,
            estimatedArrivalTime: j * 10 // 10 minutes between stops
          }
        });
      }

      routes.push(route);
    }
    console.log(`✅ Created ${routes.length} routes with stops\n`);

    // 9. Create Bus Assignments (35 active assignments)
    console.log('📋 Creating Bus Assignments...');
    const assignments = [];
    const activeBuses = buses.filter(b => b.status === 'ACTIVE');
    const approvedDrivers = drivers.slice(0, 25); // First 25 are approved

    for (let i = 0; i < Math.min(35, activeBuses.length, approvedDrivers.length); i++) {
      const bus = activeBuses[i];
      const driver = approvedDrivers[i % approvedDrivers.length];
      const route = routes[i % routes.length];

      const assignment = await prisma.busAssignment.create({
        data: {
          busId: bus.id,
          driverId: driver.id,
          routeId: route.id,
          startTime: new Date(Date.now() - Math.floor(Math.random() * 4) * 3600000), // Started 0-4 hours ago
          status: ['ACTIVE', 'SCHEDULED'][Math.floor(Math.random() * 2)],
          organizationId: bus.organizationId
        }
      });
      assignments.push(assignment);
    }
    console.log(`✅ Created ${assignments.length} bus assignments\n`);

    // 10. Create Driver Locations (for active assignments)
    console.log('📍 Creating Driver Locations...');
    const activeAssignments = assignments.filter(a => a.status === 'ACTIVE');
    for (const assignment of activeAssignments) {
      await prisma.driverLocation.create({
        data: {
          driverId: assignment.driverId,
          latitude: 27.7 + (Math.random() - 0.5) * 0.1,
          longitude: 85.3 + (Math.random() - 0.5) * 0.1,
          speed: Math.floor(20 + Math.random() * 40), // 20-60 km/h
          heading: Math.floor(Math.random() * 360),
          accuracy: Math.floor(5 + Math.random() * 15)
        }
      });
    }
    console.log(`✅ Created ${activeAssignments.length} driver locations\n`);

    // 11. Create Trips (200 completed trips)
    console.log('🎫 Creating Trips...');
    for (let i = 0; i < 200; i++) {
      const assignment = assignments[Math.floor(Math.random() * assignments.length)];
      const route = routes.find(r => r.id === assignment.routeId);
      const startTime = new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000); // Last 30 days
      const duration = Math.floor(20 + Math.random() * 60); // 20-80 minutes
      const endTime = new Date(startTime.getTime() + duration * 60000);

      await prisma.trip.create({
        data: {
          driverId: assignment.driverId,
          assignmentId: assignment.id,
          routeId: assignment.routeId,
          startTime,
          endTime,
          distance: route?.distance || 10,
          duration,
          status: 'COMPLETED',
          driverEarnings: Math.floor((route?.basePrice || 50) * 0.7),
          organizationRevenue: Math.floor((route?.basePrice || 50) * 0.3),
          passengerCount: Math.floor(10 + Math.random() * 40)
        }
      });
    }
    console.log(`✅ Created 200 completed trips\n`);

    // 12. Create Incident Reports (20 incidents)
    console.log('⚠️  Creating Incident Reports...');
    const incidentTypes = ['BREAKDOWN', 'ACCIDENT', 'DELAY', 'TRAFFIC', 'WEATHER'];
    const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    
    for (let i = 0; i < 20; i++) {
      const assignment = assignments[Math.floor(Math.random() * assignments.length)];
      await prisma.incidentReport.create({
        data: {
          driverId: assignment.driverId,
          busId: assignment.busId,
          routeId: assignment.routeId,
          assignmentId: assignment.id,
          type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          description: 'Demo incident report for testing purposes',
          latitude: 27.7 + (Math.random() - 0.5) * 0.1,
          longitude: 85.3 + (Math.random() - 0.5) * 0.1,
          status: i < 15 ? 'RESOLVED' : 'PENDING',
          reportedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000)
        }
      });
    }
    console.log(`✅ Created 20 incident reports\n`);

    // 13. Create Wallet Transactions (500 transactions)
    console.log('💰 Creating Wallet Transactions...');
    for (let i = 0; i < 500; i++) {
      const passenger = passengers[Math.floor(Math.random() * passengers.length)];
      const wallet = await prisma.wallet.findUnique({ where: { userId: passenger.id } });
      
      if (wallet) {
        const isTopUp = Math.random() > 0.7;
        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: isTopUp ? 'TOP_UP' : 'DEDUCTION',
            amount: isTopUp ? Math.floor(100 + Math.random() * 1000) : Math.floor(20 + Math.random() * 100),
            description: isTopUp ? 'Wallet top-up' : 'Bus fare payment',
            status: 'COMPLETED'
          }
        });
      }
    }
    console.log(`✅ Created 500 wallet transactions\n`);

    // 14. Create Tap Sessions (300 sessions)
    console.log('📱 Creating Tap Sessions...');
    for (let i = 0; i < 300; i++) {
      const passenger = passengers[Math.floor(Math.random() * passengers.length)];
      const route = routes[Math.floor(Math.random() * routes.length)];
      const bus = buses[Math.floor(Math.random() * buses.length)];
      const tapInTime = new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000);
      const completed = Math.random() > 0.2;

      await prisma.tapSession.create({
        data: {
          userId: passenger.id,
          routeId: route.id,
          busId: bus.id,
          tapInTime,
          tapInLocation: kathmanduAreas[Math.floor(Math.random() * kathmanduAreas.length)].name,
          tapInLatitude: 27.7 + (Math.random() - 0.5) * 0.1,
          tapInLongitude: 85.3 + (Math.random() - 0.5) * 0.1,
          tapOutTime: completed ? new Date(tapInTime.getTime() + Math.floor(20 + Math.random() * 60) * 60000) : null,
          tapOutLocation: completed ? kathmanduAreas[Math.floor(Math.random() * kathmanduAreas.length)].name : null,
          tapOutLatitude: completed ? 27.7 + (Math.random() - 0.5) * 0.1 : null,
          tapOutLongitude: completed ? 85.3 + (Math.random() - 0.5) * 0.1 : null,
          fareAmount: completed ? route.basePrice : null,
          status: completed ? 'COMPLETED' : 'ACTIVE'
        }
      });
    }
    console.log(`✅ Created 300 tap sessions\n`);

    // 15. Create Discount Applications (50 applications)
    console.log('🎓 Creating Discount Applications...');
    const discountTypes = ['STUDENT', 'ELDERLY', 'DISABLED', 'VETERAN', 'LOW_INCOME'];
    const statuses = ['PENDING', 'APPROVED', 'REJECTED'];
    
    for (let i = 0; i < 50; i++) {
      const passenger = passengers[Math.floor(Math.random() * passengers.length)];
      await prisma.discountApplication.create({
        data: {
          userId: passenger.id,
          discountType: discountTypes[Math.floor(Math.random() * discountTypes.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          documentUrl: 'https://example.com/document.pdf',
          appliedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000)
        }
      });
    }
    console.log(`✅ Created 50 discount applications\n`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEMO DATABASE SEEDING COMPLETED!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`  👑 Super Admins: 1`);
    console.log(`  👨‍💼 Admins: 1`);
    console.log(`  🏢 Organizations: ${organizations.length}`);
    console.log(`  🚗 Drivers: ${drivers.length}`);
    console.log(`  👥 Passengers: ${passengers.length}`);
    console.log(`  🚌 Buses: ${buses.length}`);
    console.log(`  🗺️  Routes: ${routes.length}`);
    console.log(`  📋 Bus Assignments: ${assignments.length}`);
    console.log(`  🎫 Trips: 200`);
    console.log(`  ⚠️  Incidents: 20`);
    console.log(`  💰 Wallet Transactions: 500`);
    console.log(`  📱 Tap Sessions: 300`);
    console.log(`  🎓 Discount Applications: 50`);

    console.log('\n🔑 Demo Credentials:');
    console.log('  Super Admin: superadmin@sptm.com / SuperAdmin123!');
    console.log('  Admin: admin@sptm.com / Admin123!');
    console.log('  Organization: org1@sptm.com / Org123!');
    console.log('  Passenger (Phone): +977' + passengers[0].phone.replace('+977', '') + ' (OTP in console)');
    console.log('  Driver (Phone): +977' + drivers[0].phone.replace('+977', '') + ' (OTP in console)');

    console.log('\n✨ Your demo database is ready!');
    console.log('   - 100 passengers with wallets');
    console.log('   - 30 drivers with licenses');
    console.log('   - 40 buses across 4 organizations');
    console.log('   - 15 active routes in Kathmandu');
    console.log('   - 200 completed trips');
    console.log('   - Real-time location tracking');
    console.log('   - Active tap sessions');
    console.log('   - Wallet transactions history');
    console.log('\n🚀 Ready for your supervisor demo!\n');

  } catch (error) {
    console.error('💥 Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
