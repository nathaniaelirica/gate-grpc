const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const mssql = require("mssql");

const port = 50051;

// Konfigurasi koneksi ke database MS SQL
const dbConfig = {
  user: "integratif",
  password: "G3rb4ng!",
  server: "10.199.14.47",
  database: "GATE_DEV",
  options: {
    encrypt: true, // Mengaktifkan koneksi SSL
    trustServerCertificate: true, // Menerima sertifikat SSL yang tidak valid
  },
};

// Inisialisasi koneksi database
mssql
  .connect(dbConfig)
  .then(() => {
    console.log("Terhubung ke database MS SQL");
  })
  .catch((err) => {
    console.error("Koneksi ke database gagal:", err);
  });

// Memuat file proto gRPC
const protoPath = "./gate.proto";
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const gateProto = grpc.loadPackageDefinition(packageDefinition).gate;
const server = new grpc.Server();

// Definisikan implementasi service "Masuk"
function masuk(call, callback) {
  const idKartuAkses = call.request.idKartuAkses;
  const idRegisterGate = call.request.idRegisterGate;

  // Cek apakah id_kartu_akses ada di tabel kartu_akses dan is_aktif = 1
  const kartuAksesQuery = `SELECT * FROM kartu_akses WHERE id_kartu_akses = '${idKartuAkses}' AND is_aktif = 1`;
  mssql.query(kartuAksesQuery, (err, result) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else if (result.recordset.length === 0) {
      // Jika id_kartu_akses tidak ditemukan atau is_aktif != 1
      logMasuk(idKartuAkses, idRegisterGate, 0, callback);
    } else {
      // Cek apakah id_register_gate ada di tabel register_gate
      const registerGateQuery = `SELECT * FROM register_gate WHERE id_register_gate = '${idRegisterGate}'`;
      mssql.query(registerGateQuery, (err, result) => {
        if (err) {
          console.error("Error:", err);
          callback(err, null);
        } else if (result.recordset.length === 0) {
          // Jika id_register_gate tidak ditemukan
          logMasuk(idKartuAkses, idRegisterGate, 0, callback);
        } else {
          // Catat ke tabel log_masuk dan berikan response 1
          logMasuk(idKartuAkses, idRegisterGate, 1, callback);
        }
      });
    }
  });
}

// Definisikan implementasi service "Keluar"
function keluar(call, callback) {
  const idKartuAkses = call.request.idKartuAkses;
  const idRegisterGate = call.request.idRegisterGate;

  // Cek apakah id_kartu_akses ada di tabel kartu_akses dan is_aktif = 1
  const kartuAksesQuery = `SELECT * FROM kartu_akses WHERE id_kartu_akses = '${idKartuAkses}' AND is_aktif = 1`;
  mssql.query(kartuAksesQuery, (err, result) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else if (result.recordset.length === 0) {
      // Jika id_kartu_akses tidak ditemukan atau is_aktif != 1
      logKeluar(idKartuAkses, idRegisterGate, 0, callback);
    } else {
      // Cek apakah id_register_gate ada di tabel register_gate
      const registerGateQuery = `SELECT * FROM register_gate WHERE id_register_gate = '${idRegisterGate}'`;
      mssql.query(registerGateQuery, (err, result) => {
        if (err) {
          console.error("Error:", err);
          callback(err, null);
        } else if (result.recordset.length === 0) {
          // Jika id_register_gate tidak ditemukan
          logKeluar(idKartuAkses, idRegisterGate, 0, callback);
        } else {
          // Catat ke tabel log_masuk dan berikan response 1
          logKeluar(idKartuAkses, idRegisterGate, 1, callback);
        }
      });
    }
  });
}

// Fungsi untuk mencatat data ke tabel log_masuk
function logMasuk(idKartuAkses, idRegisterGate, response, callback) {
  const insertQuery = `INSERT INTO log_masuk (id_kartu_akses, id_register_gate, is_valid) VALUES ('${idKartuAkses}', '${idRegisterGate}', '${response}')`;
  mssql.query(insertQuery, (err) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      callback(null, { response: response });
    }
  });
}

function logKeluar(idKartuAkses, idRegisterGate, response, callback) {
  const insertQuery = `INSERT INTO log_keluar (id_kartu_akses, id_register_gate, is_valid) VALUES ('${idKartuAkses}', '${idRegisterGate}', '${response}')`;
  mssql.query(insertQuery, (err) => {
    if (err) {
      console.error("Error:", err);
      callback(err, null);
    } else {
      callback(null, { response: response });
    }
  });
}

// Mengaitkan implementasi service dengan definisi protobuf
server.addService(gateProto.GateService.service, {
  masuk: masuk,
  keluar: keluar,
});

// Menjalankan server gRPC
server.bindAsync(
  `0.0.0.0:${port}`,
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log(`gRPC server running on port ${port}`);
    server.start();
  }
);