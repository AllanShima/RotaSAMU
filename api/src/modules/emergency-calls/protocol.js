// Protocolo do chamado: AAAAMMDD-NNNN (ex: 20261102-0007).
// A data é a de Marília (America/Sao_Paulo) e o número reinicia a cada dia.

const TIME_ZONE = "America/Sao_Paulo";

// "en-CA" formata como AAAA-MM-DD.
const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const protocolDate = (now = new Date()) =>
  dateFormat.format(now).replaceAll("-", "");

export const formatProtocol = (date, number) =>
  `${date}-${String(number).padStart(4, "0")}`;

// Reserva o próximo número do dia. O incremento é atômico no banco, então
// chamados simultâneos nunca recebem o mesmo número. Deve rodar na mesma
// transação que cria o chamado: se ela falhar, o número não é consumido.
export const nextProtocol = async (tx, now = new Date()) => {
  const date = protocolDate(now);

  const [{ lastNumber }] = await tx.$queryRaw`
    INSERT INTO "ProtocolCounter" ("date", "lastNumber")
    VALUES (${date}, 1)
    ON CONFLICT ("date")
    DO UPDATE SET "lastNumber" = "ProtocolCounter"."lastNumber" + 1
    RETURNING "lastNumber"
  `;

  return formatProtocol(date, lastNumber);
};
