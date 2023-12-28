document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => {compose_email()} );

  // Listen for subbmit button
  document.querySelector('#compose-form').onsubmit = sent_email

  // By default, load the inbox
  load_mailbox('inbox');
});


 // Fills out the compose form 
function reply_email(email) {

  //console.log(email)
  
  let composeRecipients = email.sender;
  let composeSubject = `Re: ${email.subject}`;
  let composeBody = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n`;

  compose_email(composeRecipients, composeSubject, composeBody);

  
}

// Archive or unarchive an email
function archive_email(email) {

  //console.log(id)

  let archived = true
  if (email.archived) {
    archived = false
  }
  
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archived
    })
  })

  load_mailbox('inbox');
  location.reload() 
}

// Load the compose email view
function compose_email(composeRecipients = "", composeSubject = "", composeBody = "") {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = composeRecipients;
  document.querySelector('#compose-subject').value = composeSubject;
  document.querySelector('#compose-body').value = composeBody;
}

// Send a POST request to the API to send an email
function sent_email() {
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  //console.log(recipients, subject, body)

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {

      //console.log(result);

      load_mailbox('sent');
  });
  return false;
}


// Load email details
function openEmail(event) {
  let email = event.currentTarget
  email = email.querySelector('.subjectTile')
  const id = email.dataset.id
  //console.log(id)

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    //console.log(email);
    if (!email.read) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }

    // Hide emails-view and show email
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email').style.display = 'block';

    emailDetail = document.createElement('div');
    document.querySelector('#email').innerHTML = ""

    emailDetail.innerHTML = `<div class="sender">From: ${email.sender}</div>
                            <div class="sender">To: ${email.recipients}</div>
                            <div class="subject" data-id="${id}">Subject: ${email.subject}</div>
                            <div class="body">${email.body}</div>
                            <button class="reply">Reply</button>`
    if (email.archived) {
      emailDetail.innerHTML += `<button class="archive">Unarchive</button>`
    } 
    
    else {
      emailDetail.innerHTML += `<button class="archive">Archive</button>`
    }
    document.querySelector('#email').append(emailDetail)


// Listen for archive button
  document.querySelector('.archive').onclick = () => {
    archive_email(email)
  }

// Listen for replay button
  document.querySelector('.reply').addEventListener('click', () => {
    reply_email(email)
  });
});
}

// Load the mailbox and hide other views
function load_mailbox(mailbox) {
  
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Get mailbox content

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    //Checks which mail box is requested
    if (mailbox === 'sent') {
      buildEmailsView(emails, mailbox);
    }
    else{
    let archivedEmails = [];
    let inboxEmails = [];

    emails.forEach(element => {
      if (element.archived) {
        archivedEmails.push(element)
      }
      else{
        inboxEmails.push(element)
      }
    });
    //console.log(inboxEmails)
    //console.log(archivedEmails)

    if (mailbox === 'archive') {
      buildEmailsView(archivedEmails, mailbox);
    }
    else{
      buildEmailsView(inboxEmails, mailbox)
    }
    }
    //console.log(emails)  
});
}

// Build the requested mailbox
function buildEmailsView(emailsList, mailbox) {
  let sender
  emailsList.forEach(element => {
    emailTile = document.createElement('div');
    emailTile.className = 'emailTile';
    //console.log(element.read)
    if (element.read){
      emailTile.classList.add('read');
    }
    if (mailbox === 'sent') {
      sender = element.recipients
    }
    else{
      sender = element.sender
    }
    emailTile.innerHTML = `<span class="senderTile">${sender}</span>|<span data-id="${element.id}" class="subjectTile">${element.subject}</span><span class="timeTile">${element.timestamp}</span>`;
    document.querySelector('#emails-view').append(emailTile);
    emailTile.onclick = openEmail
  });
  
}