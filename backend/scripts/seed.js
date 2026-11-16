require('events').EventEmitter.prototype.setMaxListeners(0);
require('dotenv').config(); // carga backend/.env
const admin = require('firebase-admin');

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!b64) { console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 no está definido'); process.exit(1); }
const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();

async function main() {
  // ---- Usuarios demo ----
  let instructor, aspirante;
  try {
    instructor = await auth.createUser({ email: 'instructor@demo.com', password: 'Demo123456', displayName: 'Instructor Demo' });
  } catch { instructor = (await auth.getUserByEmail('instructor@demo.com')); }
  try {
    aspirante = await auth.createUser({ email: 'aspirante@demo.com', password: 'Demo123456', displayName: 'Aspirante Demo' });
  } catch { aspirante = (await auth.getUserByEmail('aspirante@demo.com')); }

  // ---- Catálogo jerárquico ----
  await db.collection('asociaciones').doc('demo').set({ id_asociacion: 'demo', nombre_asoc: 'Club Demo' });
  await db.collection('distritos').doc('demo').set({ id_distrito: 'demo', nombre_dist: 'Distrito Demo', asoc_id: 'demo' });
  await db.collection('clubes').doc('demo').set({ id_club: 'demo', nombre_club: 'Club Demo', distrito_id: 'demo' });
  await db.collection('roles').doc('demo').set({ id_rol: 'demo', rol: 'aspirante' });
  await db.collection('roles').doc('admin').set({ id_rol: 'admin', rol: 'admin' });

  // ---- Medallones: mínimo de secciones que el aspirante debe elegir ----
  await db.collection('tipo_medallon').doc('plata').set({ id_tipo: 'plata', tipo_medallon: 'Medallón de plata', secciones_min: 3 });
  await db.collection('tipo_medallon').doc('oro').set({ id_tipo: 'oro', tipo_medallon: 'Medallón de oro', secciones_min: 4 });

  // ---- 5 secciones por medallón; cada una con su mínimo de requisitos ----
  const nombresSeccion = ['Fuerza', 'Resistencia', 'Velocidad', 'Flexibilidad', 'Técnica'];
  const secciones = [];
  for (const med of ['plata', 'oro']) {
    for (const nombre of nombresSeccion) {
      const base = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      secciones.push({
        id: med === 'plata' ? base : `${base}-oro`,
        nombre,
        medallon_id: med,
        descripcion: `Pruebas de ${nombre.toLowerCase()} del ${med === 'plata' ? 'medallón de plata' : 'medallón de oro'}`,
        requisitos_min: 1,
      });
    }
  }
  for (const s of secciones) {
    await db.collection('secciones').doc(s.id).set({
      id_seccion: s.id,
      seccion: s.nombre,
      descripcion: s.descripcion,
      medallon_id: s.medallon_id,
      requisitos_min: s.requisitos_min,
    });
  }

  // ---- Requisitos (unidad: distancia | segundos | reps) ----
  const requisitos = [
    { id: 'sentadillas', seccion_id: 'fuerza', requisito: 'Sentadillas', referencia: '30', unidad: 'reps' },
    { id: 'flexiones', seccion_id: 'fuerza', requisito: 'Flexiones', referencia: '24', unidad: 'reps' },
    { id: 'carrera', seccion_id: 'resistencia', requisito: 'Carrera 1km', referencia: '360', unidad: 'segundos' },
    { id: 'salto', seccion_id: 'velocidad', requisito: 'Salto alto', referencia: '1.50 m', unidad: 'distancia' },
    { id: 'puente', seccion_id: 'flexibilidad', requisito: 'Puente', referencia: '30', unidad: 'segundos' },
    { id: 'equilibrio', seccion_id: 'tecnica', requisito: 'Equilibrio', referencia: '20', unidad: 'segundos' },
    { id: 'dominadas-oro', seccion_id: 'fuerza-oro', requisito: 'Dominadas', referencia: '12', unidad: 'reps' },
    { id: 'carrera-oro', seccion_id: 'resistencia-oro', requisito: 'Carrera 3km', referencia: '900', unidad: 'segundos' },
    { id: 'sprint-oro', seccion_id: 'velocidad-oro', requisito: 'Sprint 100 m', referencia: '14', unidad: 'segundos' },
    { id: 'split-oro', seccion_id: 'flexibilidad-oro', requisito: 'Split', referencia: '60', unidad: 'segundos' },
    { id: 'salto-largo-oro', seccion_id: 'tecnica-oro', requisito: 'Salto largo', referencia: '2.20 m', unidad: 'distancia' },
  ];
  for (const r of requisitos) {
    await db.collection('requisitos').doc(r.id).set({ id_requisito: r.id, ...r });
  }

  // ---- Inscripción del aspirante demo (plata: 3 de 5 secciones) ----
  const seccElegidas = ['fuerza', 'resistencia', 'velocidad'];
  const reqsPorSeccion = {
    fuerza: ['sentadillas', 'flexiones'],
    resistencia: ['carrera'],
    velocidad: ['salto'],
  };
  await db.collection('inscripciones').doc(`${aspirante.uid}_plata`).set({
    aspirante_id: aspirante.uid,
    medallon_id: 'plata',
    club_id: 'demo',
    secciones: seccElegidas,
    requisitos_por_seccion: reqsPorSeccion,
    fecha_inscripcion: new Date().toISOString(),
    estado: 'en_curso',
  });

  // ---- Matriz de evaluación (inscripcion_requisitos) ----
  const batch = db.batch();
  for (const sid of seccElegidas) {
    for (const rid of reqsPorSeccion[sid]) {
      const ref = db.collection('inscripcion_requisitos').doc(`${aspirante.uid}_${rid}`);
      batch.set(ref, {
        aspirante_id: aspirante.uid,
        requisito_id: rid,
        seccion_id: sid,
        medallon_id: 'plata',
        resultado: rid === 'sentadillas' ? 'aprobado' : null,
        valor: rid === 'sentadillas' ? '3x10' : '',
        fecha_logrado: rid === 'sentadillas' ? new Date().toISOString() : '',
        registrado_por: instructor.uid,
      });
    }
  }
  await batch.commit();

  // ---- Progreso propio del aspirante (opcional, para MisRequisitos) ----
  await db.collection('progreso_aspirante').doc(`${aspirante.uid}_sentadillas`).set({ aspirante_id: aspirante.uid, requisito_id: 'sentadillas', valor_registrado: 10, fecha_actualizado: new Date().toISOString() });

  // ---- Compatibilidad: colección pruebas (legacy) ----
  await db.collection('pruebas').doc(`${aspirante.uid}_sentadillas`).set({ aspirante_id: aspirante.uid, requisito_id: 'sentadillas', resultado: 'aprobado', valor: '3x10', fecha_logrado: new Date().toISOString(), registrado_por: instructor.uid });

  // ---- Usuarios / membresía ----
  await db.collection('aspirante_club').doc(aspirante.uid).set({ club_id: 'demo' });
  await db.collection('usuarios').doc(instructor.uid).set({ id_usuario: instructor.uid, nombre: 'Instructor Demo', email: 'instructor@demo.com', telefono: '3001234567', rol: 'instructor', club_id: 'demo' });
  await db.collection('usuarios').doc(aspirante.uid).set({ id_usuario: aspirante.uid, nombre: 'Aspirante Demo', email: 'aspirante@demo.com', telefono: '3009876543', rol: 'aspirante', club_id: 'demo' });

  console.log('=== Seed completado ===');
  console.log('Usuarios:');
  console.log(`  Instructor: instructor@demo.com / Demo123456 (uid: ${instructor.uid})`);
  console.log(`  Aspirante: aspirante@demo.com / Demo123456 (uid: ${aspirante.uid})`);
  console.log('');
  console.log('Para probar localmente:');
  console.log('  cd backend && npm run start:dev');
  console.log('  cd frontend && npm run dev');
  console.log('');
  console.log('Luego visitar: http://localhost:5173/login');
  console.log('Login instructor: instructor@demo.com / Demo123456');
  console.log('Login aspirante: aspirante@demo.com / Demo123456');
}

main().catch(e => { console.error(e); process.exit(1); });
