import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

export const executeCode = async (language, sourceCode) => {
  if(language === "go") { //todo: replace this with go parser output (and possibly remove other languages
    return {run: {stdout: "TESTING", stderr: "", code: 0, signal: null, output: "TESTING OUTPUT"}}
  }
  const response = await API.post("/execute", {
    language: language,
    version: LANGUAGE_VERSIONS[language],
    files: [
      {
        content: sourceCode,
      },
    ],
  });
  return response.data;
};
