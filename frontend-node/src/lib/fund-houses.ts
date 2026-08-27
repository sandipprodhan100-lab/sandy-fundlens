/**
 * Registry of Indian AMCs whose published documents MF Lens archives.
 *
 * `pages` are the public landing pages where the AMC publishes its monthly
 * factsheet and portfolio/scheme documents. The harvester reads those pages,
 * collects PDF links and stores them in S3 under documents/<house>/<type>/.
 */

export type FundHouseDef = {
  /** canonical fund-house name, matched against AMFI scheme metadata */
  name: string;
  /** alternate spellings found in scheme names */
  aliases: string[];
  pages: string[];
};

export const FUND_HOUSES: FundHouseDef[] = [
  {
    name: "HDFC Mutual Fund",
    aliases: ["hdfc"],
    pages: [
      "https://www.hdfcfund.com/investor-corner/downloads/factsheet",
      "https://www.hdfcfund.com/statutory-disclosure/portfolio-disclosure",
    ],
  },
  {
    name: "ICICI Prudential Mutual Fund",
    aliases: ["icici prudential", "icici pru"],
    pages: [
      "https://www.icicipruamc.com/downloads/factsheet",
      "https://www.icicipruamc.com/downloads/portfolio-disclosure",
    ],
  },
  {
    name: "SBI Mutual Fund",
    aliases: ["sbi"],
    pages: [
      "https://www.sbimf.com/docs/default-source/default-document-library/factsheet",
      "https://www.sbimf.com/download/portfolio-disclosure",
    ],
  },
  {
    name: "Nippon India Mutual Fund",
    aliases: ["nippon india", "reliance"],
    pages: [
      "https://mf.nipponindiaim.com/investor-service/downloads/factsheet",
      "https://mf.nipponindiaim.com/investor-service/downloads/monthly-portfolio",
    ],
  },
  {
    name: "Axis Mutual Fund",
    aliases: ["axis"],
    pages: [
      "https://www.axismf.com/statutory-disclosures/factsheet",
      "https://www.axismf.com/statutory-disclosures/monthly-portfolio",
    ],
  },
  {
    name: "Kotak Mahindra Mutual Fund",
    aliases: ["kotak"],
    pages: [
      "https://www.kotakmf.com/Information/forms-and-downloads",
      "https://www.kotakmf.com/Information/statutory-disclosure",
    ],
  },
  {
    name: "Aditya Birla Sun Life Mutual Fund",
    aliases: ["aditya birla", "birla sun life", "absl"],
    pages: [
      "https://mutualfund.adityabirlacapital.com/forms-and-downloads/factsheet",
      "https://mutualfund.adityabirlacapital.com/forms-and-downloads/portfolio",
    ],
  },
  {
    name: "UTI Mutual Fund",
    aliases: ["uti"],
    pages: ["https://www.utimf.com/forms-and-downloads/", "https://www.utimf.com/statutory-disclosures/"],
  },
  {
    name: "Mirae Asset Mutual Fund",
    aliases: ["mirae"],
    pages: [
      "https://www.miraeassetmf.co.in/downloads/factsheet",
      "https://www.miraeassetmf.co.in/downloads/portfolio",
    ],
  },
  {
    name: "DSP Mutual Fund",
    aliases: ["dsp"],
    pages: ["https://www.dspim.com/downloads/factsheet", "https://www.dspim.com/downloads/portfolio-disclosure"],
  },
  {
    name: "Canara Robeco Mutual Fund",
    aliases: ["canara robeco"],
    pages: ["https://www.canararobeco.com/downloads/factsheet", "https://www.canararobeco.com/downloads"],
  },
  {
    name: "Quant Mutual Fund",
    aliases: ["quant"],
    pages: ["https://quantmutual.com/downloads", "https://quantmutual.com/statutory-disclosures"],
  },
  {
    name: "Motilal Oswal Mutual Fund",
    aliases: ["motilal oswal"],
    pages: [
      "https://www.motilaloswalmf.com/download/factsheet",
      "https://www.motilaloswalmf.com/download/portfolio",
    ],
  },
  {
    name: "PPFAS Mutual Fund",
    aliases: ["parag parikh", "ppfas"],
    pages: ["https://amc.ppfas.com/downloads/factsheet/", "https://amc.ppfas.com/schemes/parag-parikh-flexi-cap-fund/portfolio-disclosure/"],
  },
  {
    name: "Edelweiss Mutual Fund",
    aliases: ["edelweiss"],
    pages: ["https://www.edelweissmf.com/downloads/factsheet", "https://www.edelweissmf.com/statutory-disclosure"],
  },
  {
    name: "Franklin Templeton Mutual Fund",
    aliases: ["franklin"],
    pages: [
      "https://www.franklintempletonindia.com/downloadsServlet/pdf/factsheet",
      "https://www.franklintempletonindia.com/investor/forms-and-downloads",
    ],
  },
  {
    name: "Invesco Mutual Fund",
    aliases: ["invesco"],
    pages: ["https://www.invescomutualfund.com/downloads", "https://www.invescomutualfund.com/statutory-disclosure"],
  },
  {
    name: "Tata Mutual Fund",
    aliases: ["tata"],
    pages: ["https://www.tatamutualfund.com/downloads", "https://www.tatamutualfund.com/statutory-disclosures"],
  },
  {
    name: "Bandhan Mutual Fund",
    aliases: ["bandhan", "idfc"],
    pages: ["https://bandhanmutual.com/downloads", "https://bandhanmutual.com/statutory-disclosure"],
  },
  {
    name: "HSBC Mutual Fund",
    aliases: ["hsbc", "l&t"],
    pages: ["https://www.assetmanagement.hsbc.co.in/en/mutual-funds/investor-resources/downloads"],
  },
];

export function matchFundHouse(schemeOrHouse: string): FundHouseDef | null {
  const n = schemeOrHouse.toLowerCase();
  let best: FundHouseDef | null = null;
  for (const house of FUND_HOUSES) {
    for (const alias of [house.name.toLowerCase().replace(" mutual fund", ""), ...house.aliases]) {
      if (n.includes(alias) && (!best || alias.length > best.name.length)) best = house;
    }
  }
  return best;
}
