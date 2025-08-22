import React from "react";

const diasSemana = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const meses = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export default function DataHoje() {
  const hoje = new Date();
  const diaSemana = diasSemana[hoje.getDay()];
  const dia = hoje.getDate();
  const mes = meses[hoje.getMonth()];
  const ano = hoje.getFullYear();

  return (
    <span className="text-xs md:text-base flex justify-end text-gray-500 dark:text-gray-300 text-end">
      Hoje, {diaSemana}, {dia} de {mes} de {ano}
    </span>
  );
}
