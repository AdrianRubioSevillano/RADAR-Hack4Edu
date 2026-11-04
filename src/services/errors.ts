import {
  InferenceError,
  KnowledgeGraphError,
  QuestionBankError,
  type AnswerError,
} from "./engine.ts";

// Mensaje para la persona que usa la aplicación. Los errores tipados del motor
// indican datos corruptos o un fallo de integración, no un error del alumno.
export function describeEngineError(error: unknown): string {
  if (error instanceof InferenceError)
    return `Datos no válidos (${error.code}): ${error.message}`;
  if (error instanceof QuestionBankError)
    return `Banco no válido (${error.code}): ${error.message}`;
  if (error instanceof KnowledgeGraphError)
    return `Grafo no válido (${error.code}): ${error.message}`;
  if (error instanceof Error) return error.message;
  return "Error desconocido.";
}

export function describeAnswerError(error: AnswerError): string {
  switch (error.code) {
    case "INVALID_NUMERIC_FORMAT":
      return "Escribe un entero o una fracción, por ejemplo 5 o 3/4. No se admiten decimales ni expresiones.";
    case "ZERO_DENOMINATOR":
      return "El denominador no puede ser 0.";
    case "UNKNOWN_OPTION":
      return "Elige una de las opciones de la pregunta.";
    case "REPEATED_QUESTION":
      return "Esta pregunta ya está respondida.";
    case "UNKNOWN_QUESTION":
      return "Esta pregunta no pertenece al banco.";
    default:
      return error.message;
  }
}
