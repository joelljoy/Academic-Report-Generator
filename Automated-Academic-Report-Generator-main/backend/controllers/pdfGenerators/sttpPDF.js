import { generateFdpPDF as _ } from "./fdpPDF.js"; // reuse logic
export const generateSttpPDF = async (req, res) => {
  // Just call FDP generator but change file name in headers
  const originalWriteHead = res.writeHead;
  res.writeHead = (...args) => {
    args[1] = {
      ...args[1],
      "Content-Disposition": `attachment; filename=STTP_Report_${req.params.id}.pdf`,
    };
    return originalWriteHead.apply(res, args);
  };
  return _.call(null, req, res);
};
export default generateSttpPDF;
