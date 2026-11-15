require('events').EventEmitter.prototype.setMaxListeners(0);
const admin = require('firebase-admin');
const path = require('path');

// Read base64-encoded service account from env
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!b64) { console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 no está definido'); process.exit(1); }
const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();

async function main() {
  // Usuarios demo
  const instructor = await auth.createUser({ email: 'instructor@demo.com', password: 'Demo123456', displayName: 'Instructor Demo' });
  const aspirante = await auth.createUser({ email: 'aspirante@demo.com', password: 'Demo123456', displayName: 'Aspirante Demo' });

  // Catálogo
  await db.collection('asociaciones').doc('demo').set({ nombre_asoc: 'Club Demo' });
  await db.collection('distritos').doc('demo').set({ nombre_dist: 'Distrito Demo', asoc_id: 'demo' });
  await db.collection('clubes').doc('demo').set({ nombre_club: 'Club Demo', distrito_id: 'demo' });
  await db.collection('roles').doc('demo').set({ rol: 'aspirante' });
  await db.collection('roles').doc('admin').set({ rol: 'admin' });
  await db.collection('tipo_medallon').doc('demo').set({ tipo_medallon: 'Medalla General' });
  await db.collection('secciones').doc('demo').set({ seccion: 'Fuerza', medallon_id: 'demo' });
  await db.collection('requisitos').doc('demo').set({ seccion_id: 'demo', requisito: 'Sentadillas', referencia: '3x10', unidad: 'reps' });
  await db.collection('progreso_aspirante').doc(`${aspirante.uid}_demo`).set({ aspirante_id: aspirante.uid, requisito_id: 'demo', valor_registrado: 15 });
  await db.collection('pruebas').doc(`${aspirante.uid}_demo`).set({ aspirante_id: aspirante.uid, requisito_id: 'demo', resultado: 'aprobado', valor: '3x10', fecha_logrado: new Date().toISOString(), registrado_por: instructor.uid });
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