// Função serverless (Vercel) — envia o e-mail de confirmação da visita.
// Variáveis de ambiente necessárias: veja .env.example
const nodemailer = require('nodemailer');

// Lista fixa de empreendimentos: o servidor NÃO confia em nome/local vindos do navegador.
const BUILDINGS = {
  ipe:       { name: 'Edifício Ipê',                  loc: 'Bairro Nossa Senhora de Fátima' },
  jacaranda: { name: 'Condomínio Jacarandá',          loc: 'Jardim Alexandre Campos' },
  getulio:   { name: 'Edifício Getúlio Business',     loc: 'Avenida Getúlio Vargas, Centro' },
  aeroporto: { name: 'Edifício Aeroporto Vista',      loc: 'Bairro Aeroporto' },
  boavista:  { name: 'Village Boa Vista',             loc: 'Bairro Boa Vista' },
  suica:     { name: 'Edifício Nova Suíça Corporate', loc: 'Bairro Nova Suíça' },
};
const SLOTS = ['09:00', '10:30', '14:00', '15:30', '17:00'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let transporter;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const b = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const name  = String(b.name  || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 80);
  const email = String(b.email || '').trim().slice(0, 120);
  const phone = String(b.phone || '').replace(/[^\d()\s+-]/g, '').slice(0, 20);
  const date  = String(b.date  || '');
  const slot  = String(b.slot  || '');
  const bld   = BUILDINGS[b.buildingId];

  if (!name || !EMAIL_RE.test(email))            return res.status(400).json({ error: 'Nome ou e-mail inválido.' });
  if (b.consent !== true)                        return res.status(400).json({ error: 'Consentimento obrigatório.' });
  if (!bld)                                      return res.status(400).json({ error: 'Empreendimento inválido.' });
  if (!SLOTS.includes(slot))                     return res.status(400).json({ error: 'Horário inválido.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + 'T12:00:00Z'))) {
    return res.status(400).json({ error: 'Data inválida.' });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (date <= today)                             return res.status(400).json({ error: 'Escolha uma data futura.' });

  const dateFmt = new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  const local = `${bld.name} — ${bld.loc}, Patos de Minas - MG`;

  const text =
`Prezado(a) ${name},

A QM Engenharia confirma o agendamento de sua visita, conforme as informações abaixo:

Data: ${dateFmt}
Horário: ${slot}
Local: ${local}

Agradecemos pela preferência e permanecemos à disposição para quaisquer esclarecimentos ou informações adicionais. Caso necessite realizar alguma alteração no agendamento ou tenha alguma dúvida, entre em contato com nossa equipe.

Será um prazer recebê-lo(a).

Atenciosamente,
Equipe QM Engenharia
Engenharia e Construção`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#f4f2ec;font-family:Arial,Helvetica,sans-serif;color:#1b2a3d;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <div style="background:#1b2a3d;color:#ffffff;padding:20px 28px;font-size:18px;font-weight:bold;">
      <span style="background:#c4643a;padding:3px 8px;border-radius:4px;margin-right:6px;">QM</span>Engenharia
    </div>
    <div style="padding:28px;font-size:15px;line-height:1.6;">
      <p>Prezado(a) ${esc(name)},</p>
      <p>A QM Engenharia confirma o agendamento de sua visita, conforme as informações abaixo:</p>
      <table style="border-collapse:collapse;margin:16px 0;font-size:15px;">
        <tr><td style="padding:4px 14px 4px 0;"><strong>Data:</strong></td><td>${esc(dateFmt)}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;"><strong>Horário:</strong></td><td>${esc(slot)}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;vertical-align:top;"><strong>Local:</strong></td><td>${esc(local)}</td></tr>
      </table>
      <p>Agradecemos pela preferência e permanecemos à disposição para quaisquer esclarecimentos ou informações adicionais. Caso necessite realizar alguma alteração no agendamento ou tenha alguma dúvida, entre em contato com nossa equipe.</p>
      <p>Será um prazer recebê-lo(a).</p>
      <p style="margin-top:28px;">Atenciosamente,<br><strong>Equipe QM Engenharia</strong><br>Engenharia e Construção</p>
    </div>
  </div>
</body></html>`;

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const company = process.env.COMPANY_EMAIL;

  try {
    const t = getTransporter();

    // 1) Confirmação para o cliente
    await t.sendMail({
      from,
      to: email,
      replyTo: company || undefined,
      subject: `Confirmação de visita — ${bld.name}`,
      text,
      html,
    });

    // 2) Aviso interno para a equipe (opcional)
    if (company) {
      await t.sendMail({
        from,
        to: company,
        replyTo: email,
        subject: `Nova visita agendada — ${bld.name} — ${dateFmt} ${slot}`,
        text:
`Nova visita agendada pelo site.

Cliente: ${name}
E-mail: ${email}
Telefone: ${phone || 'não informado'}
Empreendimento: ${bld.name}
Data: ${dateFmt}
Horário: ${slot}`,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err);
    return res.status(500).json({ error: 'Falha ao enviar o e-mail.' });
  }
};

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
