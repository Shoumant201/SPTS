import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nepali license format: Province-District-Year-Number
// Example: 01-01-2020-12345
// Province codes: 01-07 (7 provinces)
// District codes vary by province
// Nepal has license categories: A, B, C, D, E, F, G, H, I, J

const generateLicenseNumber = (province: number, district: number, year: number, number: number): string => {
  return `${String(province).padStart(2, '0')}-${String(district).padStart(2, '0')}-${year}-${String(number).padStart(5, '0')}`;
};

const nepaliNames = [
  'Ram Bahadur Thapa',
  'Sita Kumari Sharma',
  'Krishna Prasad Adhikari',
  'Maya Devi Gurung',
  'Bikash Kumar Rai',
  'Sunita Tamang',
  'Rajesh Bahadur Magar',
  'Anita Kumari Shrestha',
  'Dipak Kumar Karki',
  'Sabita Devi Poudel',
  'Nabin Kumar Limbu',
  'Kamala Kumari Thakuri',
  'Suresh Bahadur Chhetri',
  'Gita Devi Bhandari',
  'Prakash Kumar Dahal',
  'Mina Kumari Khadka',
  'Ramesh Prasad Koirala',
  'Laxmi Devi Ghimire',
  'Santosh Kumar Basnet',
  'Radha Kumari Pandey'
];

const nepaliAddresses = [
  'Kathmandu-15, Bagmati Pradesh',
  'Pokhara-10, Gandaki Pradesh',
  'Lalitpur-5, Bagmati Pradesh',
  'Biratnagar-8, Koshi Pradesh',
  'Bharatpur-12, Bagmati Pradesh',
  'Butwal-7, Lumbini Pradesh',
  'Dharan-3, Koshi Pradesh',
  'Hetauda-9, Bagmati Pradesh',
  'Nepalgunj-11, Lumbini Pradesh',
  'Itahari-6, Koshi Pradesh',
  'Birgunj-14, Madhesh Pradesh',
  'Janakpur-8, Madhesh Pradesh',
  'Dhangadhi-5, Sudurpashchim Pradesh',
  'Tulsipur-4, Lumbini Pradesh',
  'Ghorahi-10, Lumbini Pradesh',
  'Damak-7, Koshi Pradesh',
  'Bhaktapur-8, Bagmati Pradesh',
  'Kirtipur-3, Bagmati Pradesh',
  'Siddharthanagar-6, Lumbini Pradesh',
  'Mechinagar-9, Koshi Pradesh'
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Nepal license categories:
// A - Motorcycle
// B - Light vehicle (car)
// C - Light transport vehicle
// D - Heavy transport vehicle
// E - Heavy vehicle
const licenseTypes = ['A', 'B', 'C', 'D', 'E', 'A+B', 'B+C', 'C+D'];

async function seedLicenses() {
  console.log('🚗 Seeding valid driver licenses...');

  const licenses = [];

  // Generate 50 dummy licenses
  for (let i = 0; i < 50; i++) {
    const province = Math.floor(Math.random() * 7) + 1; // 1-7
    const district = Math.floor(Math.random() * 15) + 1; // 1-15
    const year = 2018 + Math.floor(Math.random() * 6); // 2018-2023
    const number = Math.floor(Math.random() * 99999) + 1;

    const licenseNumber = generateLicenseNumber(province, district, year, number);
    
    // Random date of birth (25-60 years old)
    const age = 25 + Math.floor(Math.random() * 35);
    const dateOfBirth = new Date();
    dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);
    dateOfBirth.setMonth(Math.floor(Math.random() * 12));
    dateOfBirth.setDate(Math.floor(Math.random() * 28) + 1);

    // Issue date (1-5 years ago)
    const issueDate = new Date();
    issueDate.setFullYear(issueDate.getFullYear() - (1 + Math.floor(Math.random() * 5)));

    // Expiry date (5 years from issue date)
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);

    licenses.push({
      licenseNumber,
      fullName: nepaliNames[i % nepaliNames.length],
      dateOfBirth,
      issueDate,
      expiryDate,
      licenseType: licenseTypes[Math.floor(Math.random() * licenseTypes.length)],
      bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
      address: nepaliAddresses[i % nepaliAddresses.length],
      isActive: true
    });
  }

  // Add some specific test licenses for easy testing
  const testLicenses = [
    {
      licenseNumber: '01-01-2020-00001',
      fullName: 'Test Driver One',
      dateOfBirth: new Date('1990-01-15'),
      issueDate: new Date('2020-01-01'),
      expiryDate: new Date('2025-01-01'),
      licenseType: 'B',
      bloodGroup: 'O+',
      address: 'Kathmandu-1, Bagmati Pradesh',
      isActive: true
    },
    {
      licenseNumber: '02-05-2021-12345',
      fullName: 'Test Driver Two',
      dateOfBirth: new Date('1985-05-20'),
      issueDate: new Date('2021-03-15'),
      expiryDate: new Date('2026-03-15'),
      licenseType: 'C+D',
      bloodGroup: 'A+',
      address: 'Pokhara-5, Gandaki Pradesh',
      isActive: true
    },
    {
      licenseNumber: '03-10-2019-99999',
      fullName: 'Test Driver Three',
      dateOfBirth: new Date('1988-12-10'),
      issueDate: new Date('2019-06-01'),
      expiryDate: new Date('2024-06-01'),
      licenseType: 'D',
      bloodGroup: 'B+',
      address: 'Biratnagar-10, Koshi Pradesh',
      isActive: true
    }
  ];

  licenses.push(...testLicenses);

  // Insert all licenses
  for (const license of licenses) {
    try {
      await prisma.validDriverLicense.upsert({
        where: { licenseNumber: license.licenseNumber },
        update: license,
        create: license
      });
    } catch (error) {
      console.error(`Error creating license ${license.licenseNumber}:`, error);
    }
  }

  console.log(`✅ Created ${licenses.length} valid driver licenses`);
  console.log('\n📋 Test License Numbers:');
  console.log('  - 01-01-2020-00001 (Test Driver One)');
  console.log('  - 02-05-2021-12345 (Test Driver Two)');
  console.log('  - 03-10-2019-99999 (Test Driver Three)');
}

async function main() {
  try {
    await seedLicenses();
  } catch (error) {
    console.error('Error seeding licenses:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
