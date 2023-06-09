const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const readline = require('readline');

// Memuat file proto gRPC
const protoPath = './gate.proto';
const packageDefinition = protoLoader.loadSync(protoPath);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const gateService = protoDescriptor.gate.GateService;


const client = new gateService('localhost:50051', grpc.credentials.createInsecure());

// Membuat interface untuk membaca input dari command line
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Menampilkan pilihan antara "Masuk" atau "Keluar"
console.log('Pilih layanan:');
console.log('1. Masuk');
console.log('2. Keluar');
rl.question('Pilihan: ', (choice) => {
  if (choice === '1') {
    // Meminta input ID kartu dari pengguna
    rl.question('Masukkan ID kartu: ', (idKartuAkses) => {
      // Meminta input ID register dari pengguna
      rl.question('Masukkan ID gate: ', (idRegisterGate) => {
        // Membuat request ke service "Masuk"
        const request = {
          idKartuAkses: idKartuAkses,
          idRegisterGate: idRegisterGate,
        };

        // Melakukan pemanggilan gRPC ke server
        client.masuk(request, (err, response) => {
          if (err) {
            console.error('Error:', err);
          } else {
            console.log('Response:', response);
            // Lakukan tindakan sesuai dengan response yang diterima
            if (response.response === 1) {
              console.log('Berhasil masuk');
            } else {
              console.log('Gagal masuk');
            }
          }

          // Menutup interface readline dan mengakhiri program
          rl.close();
          process.exit(0);
        });
      });
    });
  } else if (choice === '2') {
   // Meminta input ID kartu dari pengguna
   rl.question('Masukkan ID kartu: ', (idKartuAkses) => {
    // Meminta input ID register dari pengguna
    rl.question('Masukkan ID gate: ', (idRegisterGate) => {
      // Membuat request ke service "Masuk"
      const request = {
        idKartuAkses: idKartuAkses,
        idRegisterGate: idRegisterGate,
      };

      // Melakukan pemanggilan gRPC ke server
      client.keluar(request, (err, response) => {
        if (err) {
          console.error('Error:', err);
        } else {
          console.log('Response:', response);
          // Lakukan tindakan sesuai dengan response yang diterima
          if (response.response === 1) {
            console.log('Berhasil keluar');
          } else {
            console.log('Gagal keluar');
          }
        }

        // Menutup interface readline dan mengakhiri program
        rl.close();
        process.exit(0);
      });
    });
  });
  } else {
    console.log('Pilihan tidak valid');
    // Menutup interface readline dan mengakhiri program
    rl.close();
    process.exit(0);
  }
});
