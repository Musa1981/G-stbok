const express = require('express');
const fs = require('fs').promises;
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3001;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const guestbookFilePath = path.join(__dirname, 'guestbook.json');
/*
async function readGuestbookFile() {
  try {
    const data = await fs.readFile(guestbookFilePath, 'utf8');
    const cachedEntries = JSON.parse(data);
    return cachedEntries;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`File ${guestbookFilePath} does not exist. Creating a new file.`);
      await fs.writeFile(guestbookFilePath, '[]', 'utf8');
      return [];
    } else {
      console.error('Error reading guestbook.json', err);
      throw err;
    }
  }
}*/
async function readGuestbookFile() {
  try {
    await fs.access(guestbookFilePath);
    const data = await fs.readFile(guestbookFilePath, 'utf8');
    const cachedEntries = JSON.parse(data);
    return cachedEntries;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`File ${guestbookFilePath} does not exist. Creating a new file.`);
      await fs.writeFile(guestbookFilePath, '[]', 'utf8');
      return [];
    } else {
      console.error('Error reading guestbook.json', err);
      throw err;
    }
  }
}


async function saveGuestbookEntriesToFile(entries) {
  const dataToWrite = JSON.stringify(entries, null, 2);
  try {
    await fs.writeFile(guestbookFilePath, dataToWrite, 'utf8');
    console.log('Data saved successfully.');
  } catch (err) {
    console.error('Error writing to guestbook.json', err);
    throw err;
  }
}

function getFormattedTimestamp() {
  const timestamp = new Date();
  return `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

app.get('/', async function (req, res) {
  try {
    const existingEntries = await readGuestbookFile();

    console.log('Existing entries:', existingEntries);

    let entriesHtml = '';
    existingEntries.forEach(entry => {
      const formattedTimestamp = entry.timestamp || getFormattedTimestamp();
      entriesHtml += `
        <div class="guestbook-entry">
          <p><strong>Namn:</strong> ${entry.name}</p>
          <p><strong>Telefon:</strong> ${entry.telefon}</p>
          <p><strong>email:</strong> ${entry.email || entry.epost}</p>
          <p><strong>Meddelande:</strong> ${entry.message}</p>
          <p><strong>Datum:</strong> ${formattedTimestamp}</p>
          <hr>
        </div>
      `;
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <link rel="stylesheet" href="style.css">
        <title>Gästbok</title>
      </head>
      <body>
        <div class="container mt-5">
          <h1 class="mb-4">Välkommen till min Gästbok</h1>
          <form id="guestbookForm" action="/addEntry" method="post">
            <div class="form-group">
              <label for="name">Namn:</label>
              <input type="text" class="form-control" id="name" name="name" placeholder="Namn" required autocomplete="name">
              <label for="Telefon">Telefon:</label>
              <input type="text" class="form-control" id="Telefon" name="telefon" placeholder="Telefon" required autocomplete="tel">
              <label for="email">email:</label>
              <input type="text" class="form-control" id="E-post" name="email" placeholder="email" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="message">Meddelande:</label>
              <textarea class="form-control" id="message" name="message" rows="4" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary" onclick="playSound()">Lämna meddelande</button>
            <audio id="message-sound" controls style="display: none;">
              <source src="rock-cinematic-161648.mp3" type="audio/mpeg">
            </audio>
          </form>
          <div class="mt-5" id="guestbookEntries">${entriesHtml}</div>
        </div>
        <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
        <script>
          $(document).ready(function() {
            $('#guestbookForm').submit(async function(event) {
              event.preventDefault();
              const data = $(this).serialize();
              const response = await $.post('/addEntry', data);
              $('#guestbookEntries').prepend(response);
              $('#guestbookForm')[0].reset(); 
            });
          });
        </script>
      </body>
    </html>
    `);
  } catch (error) {
    console.error('Error reading guestbook file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/addEntry', async (req, res) => {
  try {
    const name = req.body.name;
    const telefon = req.body.telefon;
    const email = req.body.email;
    const message = req.body.message;

    const timestamp = getFormattedTimestamp();
    const newEntry = { name, telefon, email, message, timestamp };

    const existingEntries = await readGuestbookFile();

    existingEntries.push(newEntry);

    // Spara alla inlägg till guestbook.json
    await saveGuestbookEntriesToFile(existingEntries);

    const entryHtml = `
      <div class="guestbook-entry">
        <p><strong>Namn:</strong> ${newEntry.name}</p>
        <p><strong>Telefon:</strong> ${newEntry.telefon}</p>
        <p><strong>email:</strong> ${newEntry.email}</p>
        <p><strong>Meddelande:</strong> ${newEntry.message}</p>
        <p><strong>Tid:</strong> ${timestamp}</p>
        <hr>
      </div>
    `;
    
    res.send(entryHtml);

  } catch (error) {
    console.error('Error adding entry to guestbook file:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 404 route handler
app.use(function (req, res, next) {
  res.status(404).send("Sorry, can't find that!");
});

app.listen(port, () => {
  console.log(`Servern lyssnar på port ${port}`);
});
