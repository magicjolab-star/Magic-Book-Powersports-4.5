import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_NAME = 'com.magicproduction.magicbook';
const TRACK = process.env.GOOGLE_PLAY_TRACK || 'internal';
const RELEASE_NAME = process.env.GOOGLE_PLAY_RELEASE_NAME || 'V6.0.0 Golden Master';

const AAB_FILE = path.join(
  __dirname,
  'release',
  'Magic-Book-Powersports-6.0.0-production.aab',
);

const KEY_FILE = path.join(__dirname, 'google-play-key.json');

function readCredentials() {
  const inlineJson = String(
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || '',
  ).trim();

  if (inlineJson) {
    try {
      return JSON.parse(inlineJson);
    } catch (error) {
      throw new Error(
        'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON contient un JSON invalide.',
        { cause: error },
      );
    }
  }

  const base64Json = String(
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64 || '',
  ).trim();

  if (base64Json) {
    try {
      return JSON.parse(
        Buffer.from(base64Json, 'base64').toString('utf8'),
      );
    } catch (error) {
      throw new Error(
        'GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64 est invalide.',
        { cause: error },
      );
    }
  }

  if (fs.existsSync(KEY_FILE)) {
    return JSON.parse(
      fs.readFileSync(KEY_FILE, 'utf8'),
    );
  }

  throw new Error(
    'Aucun credential Google Play disponible. Utilise GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64 ou google-play-key.json.',
  );
}

function assertAab() {
  if (!fs.existsSync(AAB_FILE)) {
    throw new Error(
      `AAB introuvable : ${AAB_FILE}`,
    );
  }

  const stat = fs.statSync(AAB_FILE);

  if (!stat.isFile() || stat.size < 1024) {
    throw new Error(
      `AAB invalide ou vide : ${AAB_FILE}`,
    );
  }
}

async function createPublisher() {
  const credentials = readCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/androidpublisher',
    ],
  });

  const client = await auth.getClient();

  return google.androidpublisher({
    version: 'v3',
    auth: client,
  });
}

async function uploadAab() {
  assertAab();

  console.log(
    `Publication Google Play : ${PACKAGE_NAME} -> track [${TRACK}]`,
  );

  const androidpublisher = await createPublisher();

  const editRes = await androidpublisher.edits.insert({
    packageName: PACKAGE_NAME,
  });

  const editId = editRes.data.id;

  if (!editId) {
    throw new Error(
      'Google Play n’a pas retourné de editId.',
    );
  }

  console.log(`Edit créé : ${editId}`);

  let committed = false;

  try {
    const uploadRes =
      await androidpublisher.edits.bundles.upload({
        packageName: PACKAGE_NAME,
        editId,
        media: {
          mimeType: 'application/octet-stream',
          body: fs.createReadStream(AAB_FILE),
        },
      });

    const versionCode =
      String(uploadRes.data.versionCode || '').trim();

    if (!versionCode) {
      throw new Error(
        'Google Play n’a pas retourné de versionCode après upload.',
      );
    }

    console.log(
      `AAB uploadé. Version Code : ${versionCode}`,
    );

    await androidpublisher.edits.tracks.update({
      packageName: PACKAGE_NAME,
      editId,
      track: TRACK,
      requestBody: {
        track: TRACK,
        releases: [
          {
            name: RELEASE_NAME,
            versionCodes: [versionCode],
            status: 'completed',
          },
        ],
      },
    });

    console.log(
      `Release assignée à la piste [${TRACK}].`,
    );

    await androidpublisher.edits.validate({
      packageName: PACKAGE_NAME,
      editId,
    });

    console.log('Edit Google Play validé.');

    await androidpublisher.edits.commit({
      packageName: PACKAGE_NAME,
      editId,
    });

    committed = true;

    console.log(
      '✅ Magic Book Powersports V6.0.0 est publié sur la piste Internal.',
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          packageName: PACKAGE_NAME,
          track: TRACK,
          releaseName: RELEASE_NAME,
          versionCode,
          aab: AAB_FILE,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (!committed) {
      try {
        await androidpublisher.edits.delete({
          packageName: PACKAGE_NAME,
          editId,
        });
      } catch {
        // Best-effort cleanup only.
      }
    }

    throw error;
  }
}

uploadAab().catch((error) => {
  const message =
    error?.response?.data?.error?.message ||
    error?.message ||
    String(error);

  console.error(
    `❌ Échec publication Google Play : ${message}`,
  );

  process.exit(1);
});
