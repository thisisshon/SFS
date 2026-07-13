/**
 * FAQ knowledge base - single source of truth for the /faqs page.
 *
 * This one dataset feeds THREE consumers, so they can never drift:
 *   1. The on-page browse experience (category -> product -> FAQ drill-down).
 *   2. The page's FAQPage JSON-LD (via faqPageSchema in src/lib/seo.ts).
 *   3. The on-site FAQ Assistant - a self-contained, retrieval-only helper whose
 *      ENTIRE knowledge is the answers below. It has no model and no external
 *      source, so it is structurally incapable of answering anything that is not
 *      grounded in this file. To change what the assistant "knows", edit here.
 *
 * Answers are plain text (no HTML) so they are valid for both the accordion's
 * set:html render and the FAQPage schema's plain-text `text` field.
 */

export interface Faq {
  q: string;
  a: string;
}

export interface FaqProduct {
  /** URL slug of the product's own page (also the drill-down key). */
  slug: string;
  name: string;
  /** Link to the full product page. */
  href: string;
  /** One-line description for the product card. */
  blurb: string;
  faqs: Faq[];
}

export interface FaqCategory {
  /** Stable id used as the drill-down key + DOM hooks. */
  id: string;
  name: string;
  /** One-line description for the category card. */
  tagline: string;
  /** Icon key into the ICONS map in faqs.astro. */
  icon: string;
  products: FaqProduct[];
}

export const faqCategories: FaqCategory[] = [
  {
    id: 'trading',
    name: 'Trading & Markets',
    tagline: 'Buy and sell across equities, derivatives, currency and commodities.',
    icon: 'trading',
    products: [
      {
        slug: 'equity',
        name: 'Equity',
        href: '/equity',
        blurb: 'Own shares of India\'s listed companies on NSE and BSE.',
        faqs: [
          { q: 'What are equity shares?', a: 'Equity shares represent part-ownership in a company. When you buy them you become a shareholder and can benefit from the company\'s growth through share price appreciation and dividends.' },
          { q: 'How do I start investing in stocks in India?', a: 'Open a Demat and Trading account with a SEBI-registered broker, complete your PAN and KYC, add funds, research the stocks you want, and place your first order on NSE or BSE.' },
          { q: 'Do I need a Demat account to buy shares?', a: 'Yes. A Demat account holds your shares in electronic form and is mandatory for delivery-based buying and selling on Indian exchanges, while a linked Trading account is used to place orders.' },
          { q: 'Who is eligible to invest in equity in India?', a: 'Any Indian resident aged 18 or above with a PAN and completed KYC can invest; minors can invest through a guardian, and NRIs can invest via NRE/NRO accounts through an authorised broker.' },
          { q: 'What is the minimum amount needed to invest in stocks?', a: 'There is no fixed minimum. You can start with the price of a single share, so equity investing is accessible even with a small budget.' },
          { q: 'What charges apply when I trade equity?', a: 'Brokerage plus statutory and exchange charges apply, including STT, GST, SEBI and exchange transaction fees, stamp duty, and depository (DP) charges on delivery sells. Refer to the schedule of charges for the exact amounts.' },
          { q: 'How are profits from shares taxed?', a: 'Listed equity held up to 12 months is taxed as short-term capital gains, and gains on holdings beyond 12 months are taxed as long-term capital gains with an annual exemption limit. Dividends are added to your income and taxed at your slab rate.' },
          { q: 'What is the difference between intraday and delivery trading?', a: 'In delivery trading you take ownership of the shares into your Demat account and can hold them as long as you wish, whereas intraday positions are bought and sold within the same trading day and must be squared off before market close.' },
          { q: 'What are the trading hours and settlement cycle for equities?', a: 'The equity cash market on NSE and BSE is normally open from 9:15 AM to 3:30 PM IST on weekdays, and trades currently settle on a T+1 basis, meaning shares and funds are settled one working day after the trade.' },
          { q: 'What is the difference between NSE and BSE?', a: 'Both are SEBI-regulated stock exchanges; NSE is India\'s largest by trading volume and runs the NIFTY 50 index, while BSE is Asia\'s oldest exchange and runs the SENSEX. Most large companies are listed on both.' },
          { q: 'What are the main risks of investing in equity?', a: 'Share prices fluctuate with market, economic and company-specific factors, so the value of your investment can rise or fall and you may get back less than you invested. Diversifying and investing with a long-term view can help manage this risk, but returns are never guaranteed.' },
        ],
      },
      {
        slug: 'derivatives',
        name: 'Derivatives',
        href: '/derivatives',
        blurb: 'Trade futures and options on stocks and indices via NSE and BSE.',
        faqs: [
          { q: 'What is derivatives trading?', a: 'Derivatives trading means buying and selling contracts whose value is derived from an underlying asset such as a stock or index. In India this is mainly done through exchange-traded Futures and Options (F&O) on NSE and BSE.' },
          { q: 'What is the difference between futures and options?', a: 'A futures contract is a binding agreement obligating both parties to buy or sell at a set price on a future date, while an option gives the buyer the right, but not the obligation, to buy or sell. A futures buyer\'s risk can be large, whereas an option buyer\'s loss is limited to the premium paid.' },
          { q: 'What is a lot size in F&O?', a: 'Derivatives are traded in fixed quantities called lots, not single shares. The exchange sets the lot size for each contract, so your order value and margin depend on the lot size multiplied by the price.' },
          { q: 'What is margin in derivatives trading?', a: 'Margin is the collateral you deposit with your broker to take and hold a futures or short-option position. It is set by SEBI and the exchanges using the SPAN system plus an exposure margin, and must be maintained throughout the day under peak-margin rules.' },
          { q: 'Do I need any special account to trade F&O?', a: 'You need a Trading account with the F&O segment activated, linked to a Demat account. Brokers usually ask for income proof, such as bank statements or a salary slip, before enabling the derivatives segment.' },
          { q: 'What is contract expiry and what happens on it?', a: 'Every derivative contract has a fixed expiry date after which it ceases to exist. On expiry, index contracts are cash-settled, in-the-money stock options can lead to physical delivery, and futures positions must be closed or rolled over to the next series.' },
          { q: 'What charges apply to F&O trading?', a: 'Brokerage plus statutory and exchange charges apply, including STT on the sell side, exchange transaction charges, SEBI fees, GST and stamp duty. Refer to the schedule of charges for the exact figures.' },
          { q: 'How are F&O profits taxed in India?', a: 'Profits from exchange-traded F&O are generally treated as non-speculative business income and taxed at your applicable income tax slab rate. A tax audit may be required if turnover crosses the prescribed threshold, so consult a tax adviser.' },
          { q: 'Is derivatives trading risky for beginners?', a: 'Yes. Leverage magnifies both gains and losses, and a small adverse move can wipe out your margin, with futures losses potentially exceeding the amount deposited. Beginners should start small, understand the product, and use tools like stop-loss orders.' },
          { q: 'Can derivatives be used to protect my portfolio?', a: 'Yes. Traders and investors use derivatives to hedge, for example buying index puts or shorting futures to offset potential losses in their holdings. Hedging reduces certain risks but adds cost and does not eliminate risk entirely.' },
          { q: 'What is a margin call in F&O?', a: 'If the market moves against you and your account balance falls below the required margin, the broker issues a margin call asking you to add funds. If you do not top up in time, your position may be squared off, or liquidated, to cover the shortfall.' },
        ],
      },
      {
        slug: 'currency',
        name: 'Currency',
        href: '/currency',
        blurb: 'Trade rupee currency pairs through exchange-traded derivatives.',
        faqs: [
          { q: 'What is currency trading in India?', a: 'Currency trading in India means buying and selling exchange-traded currency derivative contracts, mainly futures and options on currency pairs, on recognised exchanges such as NSE and BSE. It lets you take a view on movements in exchange rates.' },
          { q: 'Is currency trading legal in India?', a: 'Yes, when done through SEBI-regulated brokers on recognised exchanges. It operates within a framework jointly overseen by SEBI and the RBI; trading on unregulated overseas forex platforms is not permitted for Indian residents.' },
          { q: 'Which currency pairs can I trade?', a: 'The commonly available pairs are the rupee pairs USD/INR, EUR/INR, GBP/INR and JPY/INR, along with select cross-currency pairs such as EUR/USD, GBP/USD and USD/JPY. USD/INR is the most actively traded pair.' },
          { q: 'What account do I need to trade currency derivatives?', a: 'You need a Trading account with the currency derivatives segment activated. Because these are cash-settled derivatives rather than delivery of physical currency, they do not require holdings in a Demat account.' },
          { q: 'What are the trading hours for the currency segment?', a: 'The exchange-traded currency segment is generally open from 9:00 AM to 5:00 PM IST on weekdays, which is longer than the equity cash market and lets traders react to European and early US market cues.' },
          { q: 'What is the difference between currency futures and options?', a: 'Currency futures obligate both parties to settle a pair at a predetermined price on a future date, while currency options give the buyer the right, but not the obligation, to buy or sell. Futures need margin from both sides, whereas an option buyer only pays a premium.' },
          { q: 'How much money do I need to start currency trading?', a: 'It depends on the contract, the applicable margin, and your strategy. Currency contracts have a defined lot size and you pay only a margin rather than the full contract value, so requirements vary; check the schedule of charges and margin details before trading.' },
          { q: 'What charges apply to currency trading?', a: 'Brokerage plus statutory and exchange charges apply, including exchange transaction charges, SEBI fees, GST and stamp duty. Note that STT does not apply to currency derivatives; refer to the schedule of charges for the exact amounts.' },
          { q: 'How is currency trading taxed in India?', a: 'Profits from exchange-traded currency futures and options are generally treated as non-speculative business income and taxed at your applicable income tax slab rate, which also allows business losses to be carried forward subject to the rules. Consult a tax adviser for your situation.' },
          { q: 'What role does the RBI play in currency trading?', a: 'The RBI manages India\'s foreign exchange framework under FEMA and works with SEBI to oversee the exchange-traded currency derivatives market. RBI policy on interest rates and the rupee can strongly influence currency prices.' },
          { q: 'What are the main risks in currency trading?', a: 'Exchange rates can move sharply on economic data, interest-rate changes and global events, and leverage magnifies both gains and losses. Currency trading carries real risk of loss and returns are never guaranteed, so use disciplined risk management.' },
        ],
      },
      {
        slug: 'commodities',
        name: 'Commodities',
        href: '/commodities',
        blurb: 'Trade gold, silver, crude and more via MCX and NCDEX derivatives.',
        faqs: [
          { q: 'What is commodity trading in India?', a: 'Commodity trading means buying and selling exchange-traded contracts linked to commodities such as gold, silver, crude oil, natural gas and base metals on recognised exchanges like MCX and NCDEX. Most retail traders aim to profit from price movements without taking physical delivery.' },
          { q: 'Is commodity trading legal in India?', a: 'Yes. It is legal when conducted through SEBI-regulated brokers on recognised exchanges such as MCX and NCDEX, which SEBI has regulated since the commodity derivatives markets were brought under its oversight.' },
          { q: 'Which commodities are most commonly traded?', a: 'Gold, silver, crude oil, natural gas and base metals such as copper, zinc and aluminium are among the most actively traded on MCX, while NCDEX is known for agricultural commodities like cotton, guar and spices.' },
          { q: 'What account do I need to trade commodities?', a: 'You need a Trading account with the commodity derivatives segment activated with a SEBI-registered broker. As these are typically cash-settled contracts, a Demat account is not required for standard commodity futures and options trading.' },
          { q: 'What is the difference between commodity futures and options?', a: 'A commodity futures contract creates an obligation to buy or sell a fixed quantity at a future date, while a commodity option gives the buyer the right, but not the obligation, to do so. Futures require margin from both parties, whereas an option buyer pays only a premium.' },
          { q: 'How much money do I need to start?', a: 'It depends on the commodity and its contract, or lot, size. You pay only a margin rather than the full contract value, so some contracts need a few thousand rupees while larger ones need more; check the schedule of charges and margin details before trading.' },
          { q: 'What are the trading hours for commodities?', a: 'The MCX commodity segment is generally open from around 9:00 AM to 11:30 PM IST for most non-agricultural commodities like metals and energy, with the evening session aligning with international markets. Agricultural commodity timings are usually shorter.' },
          { q: 'What charges apply to commodity trading?', a: 'Brokerage plus statutory and exchange charges apply, including CTT on non-agricultural commodity sells, exchange transaction charges, SEBI fees, GST and stamp duty. Refer to the schedule of charges for the exact figures.' },
          { q: 'How can commodities be used for hedging?', a: 'Producers, consumers and investors use commodity futures to lock in prices and protect against adverse moves; for example, a jeweller can hedge gold price risk by taking an offsetting futures position. Hedging manages price risk but adds cost and does not remove all risk.' },
          { q: 'How are commodity trading profits taxed?', a: 'Profits from commodity derivatives are generally treated as non-speculative business income and added to your total income, taxed at your applicable slab rate. A tax audit may apply if turnover crosses the prescribed threshold, so consult a tax adviser.' },
          { q: 'What are the main risks in commodity trading?', a: 'Commodity prices can be highly volatile, driven by global demand and supply, geopolitics, weather and currency moves, and leverage magnifies both gains and losses. There is a real risk of loss and no guaranteed return, so use stop-losses and prudent position sizing.' },
        ],
      },
      {
        slug: 'mtf',
        name: 'Margin Trading Facility (MTF)',
        href: '/mtf',
        blurb: 'Buy more delivery shares by paying part now; the broker funds the rest.',
        faqs: [
          { q: 'What is Margin Trading Facility (MTF)?', a: 'MTF lets you buy delivery-based shares by paying only a part of the trade value as margin, while your broker funds the balance. You can hold the leveraged position for a longer period and pay interest on the funded amount until you repay it.' },
          { q: 'Is MTF legal and regulated in India?', a: 'Yes. MTF is a SEBI-regulated facility offered by registered brokers on NSE and BSE, subject to strict rules on eligible stocks, margins, pledging and investor protection.' },
          { q: 'How is MTF different from intraday and F&O?', a: 'Unlike intraday trading, MTF positions are not squared off the same day and you take actual delivery of the shares into your Demat account. Unlike futures, you own the underlying shares rather than a contract, and there is no fixed expiry, though brokers set a maximum holding period.' },
          { q: 'Which stocks are eligible for MTF?', a: 'Only shares approved by SEBI and the exchanges, typically liquid Group I securities and select ETFs, are eligible. Brokers publish and periodically update the list of MTF-eligible stocks along with their margin requirements.' },
          { q: 'What is a haircut and margin requirement in MTF?', a: 'The margin is the portion of the trade value you must fund yourself, and it varies by stock based on SEBI and exchange rules. The haircut is the discount applied to the value of securities you pledge as collateral, so higher-risk stocks carry a larger haircut and margin.' },
          { q: 'What is pledging and why is it needed in MTF?', a: 'Shares bought under MTF, or existing holdings offered as collateral, are pledged in your favour with the depository as security for the funded amount. You typically confirm the pledge through an OTP-based authorisation, in line with SEBI\'s margin pledge system.' },
          { q: 'How much leverage can I get with MTF?', a: 'MTF can increase your buying power to a multiple of your own capital, subject to the specific stock\'s eligibility, its margin requirement and broker policy. Higher leverage also increases both potential gains and potential losses.' },
          { q: 'How is MTF interest charged?', a: 'Interest is charged on the broker-funded portion of your position, usually accruing daily for as long as you hold the position. The applicable rate is set by the broker; refer to the schedule of charges for the current rate and any related fees.' },
          { q: 'How long can I hold an MTF position?', a: 'You can hold an MTF position beyond a single day, up to the maximum period set by your broker, while interest accrues on the funded amount. You can repay the funded amount to convert the shares to full delivery, or sell the position, at any time within that window.' },
          { q: 'What happens if the stock price falls or margin is short?', a: 'If the value of your position falls, you may face a margin call to add funds or collateral. If you do not meet it in time, the broker can square off, or liquidate, your pledged shares to recover the funded amount, and you bear any resulting loss.' },
          { q: 'What are the main risks of using MTF?', a: 'Because MTF uses leverage, losses are magnified just as gains are, and you continue to pay interest regardless of how the stock performs. A sharp fall can trigger forced selling, so MTF is not suitable for everyone and returns are never guaranteed; read all risk disclosures before activating it.' },
        ],
      },
    ],
  },
  {
    id: 'investing',
    name: 'Investing',
    tagline: 'Grow wealth with funds, bonds, deposits and global markets.',
    icon: 'investing',
    products: [
      {
        slug: 'mutual-funds',
        name: 'Mutual Funds',
        href: '/mutual-funds',
        blurb: 'Professionally managed, SEBI-regulated portfolios you can start from Rs 100.',
        faqs: [
          { q: 'What is a mutual fund and how does it work?', a: 'A mutual fund is a SEBI-regulated pooled investment that collects money from many investors and invests it across a diversified portfolio of stocks, bonds or other securities managed by a professional fund manager. You hold units in proportion to your investment, and their value moves with the Net Asset Value (NAV) of the underlying portfolio.' },
          { q: 'How do I start investing in mutual funds?', a: 'You need to complete KYC (PAN, Aadhaar and bank details) once, after which you can invest online through a platform, distributor or directly with the AMC. You can begin with a lump sum or set up a SIP, and most schemes let you start from as little as Rs 100 to Rs 500.' },
          { q: 'Do I need a demat account to buy mutual funds?', a: 'No, a demat account is not mandatory for regular mutual funds; units can be held in a statement-of-account (folio) form directly with the AMC or registrar. A demat account is only needed if you specifically choose to hold units in demat form or buy exchange-traded schemes.' },
          { q: 'What is the difference between SIP and lump sum?', a: 'A SIP (Systematic Investment Plan) invests a fixed amount at regular intervals, spreading your purchases across market levels and averaging your cost over time. A lump sum invests the full amount at one price in a single transaction; SIPs suit regular earners while lump sums suit deploying surplus cash.' },
          { q: 'What is NAV?', a: 'NAV, or Net Asset Value, is the per-unit price of a mutual fund scheme, calculated by taking the total market value of the portfolio minus liabilities and dividing by the number of outstanding units. It is published at the end of each business day and is the price at which you buy or redeem units.' },
          { q: 'What is the difference between a direct plan and a regular plan?', a: 'A direct plan is bought straight from the AMC with no distributor commission, so it carries a lower expense ratio and a slightly higher NAV over time. A regular plan is bought through a distributor or advisor whose commission is built into a higher expense ratio, in exchange for their guidance.' },
          { q: 'What charges apply to mutual funds?', a: 'Every scheme charges an annual expense ratio, a percentage of assets that covers management and operating costs and is already reflected in the NAV, capped by SEBI. Some schemes also levy an exit load if you redeem within a defined period; standard statutory charges such as stamp duty and applicable taxes apply as per the scheme documents.' },
          { q: 'How are mutual funds taxed in India?', a: 'For equity-oriented funds, gains on units held over a year are long-term and taxed at 12.5% above the Rs 1.25 lakh annual exemption, while gains within a year are short-term and taxed at 20%. For debt funds bought on or after 1 April 2023, gains are added to your income and taxed at your slab rate with no indexation benefit.' },
          { q: 'What is ELSS and how does it save tax?', a: 'ELSS (Equity-Linked Savings Scheme) is an equity mutual fund that qualifies for a deduction of up to Rs 1.5 lakh a year under Section 80C of the old tax regime. It has a three-year lock-in, the shortest among 80C options, and invests mainly in equities for potential long-term growth.' },
          { q: 'Are mutual fund returns guaranteed?', a: 'No, mutual fund returns are not guaranteed and are subject to market risk, since the value of your units rises and falls with the underlying portfolio. SEBI requires every scheme to carry a Riskometer disclosing its risk level, so you can match a fund to your own horizon and risk tolerance.' },
          { q: 'Can I withdraw my mutual fund money anytime?', a: 'Open-ended schemes are generally liquid, and you can redeem units on any business day with proceeds usually credited within a few working days. Exceptions include ELSS, which has a three-year lock-in, and close-ended or certain schemes that restrict early exit or apply an exit load.' },
        ],
      },
      {
        slug: 'etf',
        name: 'ETFs',
        href: '/etf',
        blurb: 'Index-tracking funds that trade on the exchange like a share.',
        faqs: [
          { q: 'What is an ETF?', a: 'An ETF, or Exchange-Traded Fund, is a SEBI-regulated fund that holds a basket of securities such as stocks, bonds or gold and usually tracks an index. Unlike a regular mutual fund, its units are listed and trade on the NSE and BSE at live market prices throughout the trading day.' },
          { q: 'How is an ETF different from a mutual fund?', a: 'A mutual fund is bought and sold once a day at that day\'s NAV directly with the AMC, whereas an ETF trades on the exchange in real time at market prices, like a share. ETFs need a demat and trading account and are typically passively managed with lower expense ratios, while mutual funds can be actively or passively managed.' },
          { q: 'Do I need a demat account to invest in ETFs?', a: 'Yes, a demat and trading account is mandatory because ETF units are held and traded like shares on the stock exchange. Once your account is active, you can search for an ETF and place a buy order during market hours.' },
          { q: 'How do I buy and sell ETFs?', a: 'You place a buy or sell order through your trading account at a market or limit price during exchange hours, and units are credited to your demat account on a T+1 settlement basis. You can exit by selling units on the exchange whenever the market is open.' },
          { q: 'What is the minimum amount to invest in an ETF?', a: 'The practical minimum is the price of one unit, which can range from a few hundred to a few thousand rupees depending on the ETF. There is no fixed minimum ticket size beyond the cost of the units you buy plus applicable charges.' },
          { q: 'What is tracking error?', a: 'Tracking error measures how closely an ETF follows the index it is designed to mirror; a lower tracking error means the fund replicates the index more faithfully. It arises from factors such as expenses, cash holdings and timing differences, so it is a key metric when comparing similar ETFs.' },
          { q: 'What charges apply when investing in ETFs?', a: 'ETFs carry a low annual expense ratio built into the fund, and on each trade you pay brokerage plus statutory charges such as STT, exchange fees, GST and stamp duty as per the schedule of charges. There is also an implicit cost in the bid-ask spread, which is wider for less liquid ETFs.' },
          { q: 'Can I do a SIP in ETFs?', a: 'You can invest in ETFs periodically, but since ETFs lack a native auto-debit mandate like mutual funds, this is done through manual or broker-scheduled recurring buy orders. Each purchase is a market trade at the prevailing price rather than at an end-of-day NAV.' },
          { q: 'How are ETFs taxed in India?', a: 'Equity and index ETFs are taxed like equity: gains over one year are long-term at 12.5% above the Rs 1.25 lakh exemption, and gains within a year are short-term at 20%. Gold, debt and international ETFs follow non-equity taxation, where gains are generally added to income and taxed at your slab rate depending on the fund type and holding period.' },
          { q: 'Are ETFs risky?', a: 'ETFs carry market risk tied to their underlying assets, so their value falls when the tracked index or basket declines. They are transparent and diversified, which generally lowers single-stock risk, but returns are not guaranteed and depend on the asset class and market conditions.' },
          { q: 'What is liquidity in an ETF and why does it matter?', a: 'Liquidity is how easily you can buy or sell an ETF near its fair value, reflected in trading volumes and a narrow bid-ask spread. Low-liquidity ETFs can be harder to exit at a good price, so checking on-exchange volumes and the indicative NAV before trading is important.' },
        ],
      },
      {
        slug: 'bonds',
        name: 'Bonds',
        href: '/bonds',
        blurb: 'Fixed-income instruments offering predictable, contracted returns.',
        faqs: [
          { q: 'What is a bond?', a: 'A bond is a debt instrument through which you lend money to a government or company for a fixed period. In return the issuer typically pays periodic interest, called the coupon, and repays the principal, or face value, on the maturity date.' },
          { q: 'What is the difference between the coupon rate and yield to maturity?', a: 'The coupon rate is the fixed annual interest paid on the bond\'s face value, so a 7% coupon on a Rs 1,000 bond pays Rs 70 a year. Yield to maturity (YTM) is the total annualised return if you hold the bond to maturity, accounting for the price you paid, the coupons and the redemption value, and is a better measure of true return.' },
          { q: 'What is a credit rating and why does it matter?', a: 'A credit rating, assigned by agencies such as CRISIL, ICRA or CARE, indicates the issuer\'s ability to pay interest and repay principal on time, with AAA the highest and D denoting default. A higher rating signals lower default risk, so checking the rating before investing is essential, and a very high coupon often signals higher risk.' },
          { q: 'What is the difference between government and corporate bonds?', a: 'Government securities (G-Secs) are issued by the central government and carry sovereign backing, making them among the lower-risk options. Corporate bonds are issued by companies and can offer higher yields but vary widely in credit quality, so they require closer evaluation of the issuer\'s rating and financial strength.' },
          { q: 'How can I invest in bonds in India?', a: 'You can buy bonds in the secondary market on the NSE and BSE through a demat and trading account, or subscribe to new issues and RBI Retail Direct for G-Secs. You can also gain diversified debt exposure indirectly through debt mutual funds and bond ETFs.' },
          { q: 'What are the main risks of investing in bonds?', a: 'The key risks are interest rate risk, where bond prices fall as rates rise; credit or default risk, where the issuer fails to pay; liquidity risk, where a bond is hard to sell at a fair price; and inflation risk, which erodes real returns. Longer-duration and lower-rated bonds are generally more sensitive to these risks.' },
          { q: 'How do bonds generate returns?', a: 'Bonds generate returns mainly through periodic coupon interest paid by the issuer over the bond\'s life. You can also earn capital gains if you sell a bond in the secondary market at a price higher than you paid, though prices can also fall below your purchase price.' },
          { q: 'What charges apply when buying bonds?', a: 'When you trade listed bonds on the exchange, brokerage and statutory charges apply as per the schedule of charges, and demat account maintenance charges may apply. Primary issues are usually bought at face value, and the effective cost is reflected in the yield you receive.' },
          { q: 'How are bond returns taxed in India?', a: 'Coupon interest from bonds is added to your income and taxed at your applicable slab rate. Capital gains on listed bonds sold after one year are long-term and taxed at 12.5%, while gains within a year are short-term and taxed at your slab rate; certain instruments such as tax-free bonds and 54EC bonds have their own special treatment.' },
          { q: 'Can I sell a bond before maturity?', a: 'Yes, listed bonds can be sold in the secondary market before maturity, but the price you receive depends on prevailing interest rates and demand, and may be above or below your purchase price. Some bonds are thinly traded, so exiting at a fair price can be harder in stressed conditions.' },
          { q: 'What is duration and how does it affect my bond?', a: 'Duration measures a bond\'s price sensitivity to interest rate changes; the longer the duration, the more its price moves when rates shift. Shorter-duration bonds tend to be less volatile in a rising-rate environment, while longer-duration bonds can gain more when rates fall.' },
        ],
      },
      {
        slug: 'fixed-deposit',
        name: 'Fixed Deposit',
        href: '/fixed-deposit',
        blurb: 'Deposit a lump sum at a fixed, contracted rate for a set tenure.',
        faqs: [
          { q: 'What is a Fixed Deposit?', a: 'A Fixed Deposit (FD) is a savings instrument offered by banks and NBFCs where you deposit a lump sum for a fixed tenure at a predetermined interest rate. The rate is locked in for the term and does not change with market movements, giving you a predictable maturity value.' },
          { q: 'What is the difference between a bank FD and a corporate FD?', a: 'A bank FD is a deposit with a bank and is covered by DICGC deposit insurance up to Rs 5 lakh per depositor per bank. A corporate or company FD is offered by NBFCs and companies, is not covered by that insurance, and often pays a higher rate to compensate for the additional risk, so the issuer\'s credit rating matters more.' },
          { q: 'What is the difference between cumulative and non-cumulative FDs?', a: 'In a cumulative FD, interest is compounded and paid together with the principal at maturity, which suits wealth building. In a non-cumulative FD, interest is paid out at regular intervals such as monthly, quarterly or annually, which suits investors who want a steady income stream.' },
          { q: 'How safe is a corporate Fixed Deposit?', a: 'The safety of a corporate FD depends on the issuer\'s credit rating from agencies like CRISIL and ICRA, where higher ratings such as AAA or FAAA indicate the strongest safety. Unlike bank FDs, corporate FDs are not covered by DICGC insurance, so checking the rating and the issuer\'s track record is important before investing.' },
          { q: 'What is the minimum amount and tenure for an FD?', a: 'Minimums vary by provider; for example, a Shriram Finance FD can be started with Rs 5,000. Tenures typically range from a few months up to five years, and longer tenures generally carry higher interest rates.' },
          { q: 'How is FD interest calculated?', a: 'For cumulative FDs, interest is compounded (often monthly or quarterly) and paid at maturity, while for non-cumulative FDs it is calculated and paid at your chosen payout frequency. You can use an FD calculator to estimate the exact maturity amount for a given rate and tenure.' },
          { q: 'Can I withdraw my FD before maturity?', a: 'Most FDs allow premature withdrawal, but it usually attracts a penalty and a lower interest rate than the contracted one, and some providers do not pay interest if withdrawn very early. The exact rules, lock-in and penalty vary by issuer, so check the specific FD terms before booking.' },
          { q: 'How is FD interest taxed?', a: 'Interest earned on an FD is fully taxable and added to your income at your applicable slab rate in the year it accrues. Providers deduct TDS once interest crosses the annual threshold, and you can submit Form 15G or 15H if your income is below the taxable limit to avoid TDS.' },
          { q: 'Do senior citizens get higher FD rates?', a: 'Yes, most banks and NBFCs offer senior citizens an additional interest rate over the standard rate, commonly around 0.25% to 0.50% higher. The exact additional rate and eligibility age depend on the provider\'s prevailing terms.' },
          { q: 'Is an FD a good option for guaranteed income?', a: 'An FD offers a fixed, contracted return and is suited to capital preservation and predictable income, especially through the non-cumulative payout option. However, returns are fixed and may not always beat inflation, so an FD is best used as the stable portion of a broader portfolio.' },
          { q: 'Can I take a loan against my FD?', a: 'Many banks and NBFCs let you borrow against your FD, typically up to a large percentage of the deposit value, without breaking the deposit. This lets you access funds for short-term needs while your FD continues to earn interest, with the loan carrying its own interest cost as per the provider\'s terms.' },
        ],
      },
      {
        slug: 'global-investing',
        name: 'Global Investing',
        href: '/global-investing',
        blurb: 'Invest in US stocks and ETFs from India under the RBI\'s LRS route.',
        faqs: [
          { q: 'What is global investing from India?', a: 'Global investing lets you invest in overseas markets, most commonly US-listed stocks and ETFs, from India through a global investing account. It is done within the RBI\'s Liberalised Remittance Scheme (LRS) framework, letting you own global brands and diversify beyond Indian assets.' },
          { q: 'How do I start investing in US stocks from India?', a: 'You open a global investing account and complete KYC, then remit funds from your Indian bank account under the LRS. Once funded, you can buy US-listed stocks, ETFs and, on many platforms, fractional shares.' },
          { q: 'What is the LRS limit?', a: 'Under the RBI\'s Liberalised Remittance Scheme, a resident individual can remit up to USD 250,000 per financial year for permitted purposes, including investment in foreign stocks. This limit is per person, so a family can pool individual limits within the rules.' },
          { q: 'What are fractional shares?', a: 'Fractional shares let you buy a slice of a high-priced stock for a small amount rather than paying for a whole share. This makes expensive US stocks accessible with a modest budget and helps you diversify across several companies.' },
          { q: 'What is currency risk in global investing?', a: 'Currency risk arises because your investment is in US dollars while your money originates in rupees, so the INR-USD exchange rate affects your returns. A stronger rupee can reduce your gains when you convert back, even if the underlying US investment rose, while a weaker rupee can add to them.' },
          { q: 'How are foreign investments taxed for Indian residents?', a: 'Gains on foreign shares are taxed in India based on holding period, and as a resident you must also report foreign assets and income in your Indian tax return under Schedule FA. Dividends from US stocks have US withholding tax deducted, which can generally be claimed as a credit in India under the double-taxation avoidance agreement.' },
          { q: 'Is there a tax collected when I remit money abroad?', a: 'Yes, remittances under the LRS attract Tax Collected at Source (TCS) above the annual threshold set by the government, which the bank collects at the time of remittance. This TCS is not an extra cost but can be adjusted against your tax liability or claimed as a refund when you file your return.' },
          { q: 'What charges apply to global investing?', a: 'Costs can include brokerage on trades, a foreign-exchange conversion fee or spread when you remit funds, bank remittance charges, and any platform or account fees as per the schedule of charges. ETFs also carry their own expense ratio, so it is worth reviewing all costs before investing.' },
          { q: 'Can I invest in US ETFs and index funds?', a: 'Yes, through a global investing account you can buy US-listed ETFs that track indices, sectors or themes, giving instant diversification in a single low-cost investment. Many investors use broad-market US ETFs as a simple way to gain diversified international exposure.' },
          { q: 'What risks should I be aware of when investing globally?', a: 'Beyond normal market risk, global investing carries currency risk, geopolitical and regulatory risk in foreign markets, and potential changes to LRS or tax rules. Returns are not guaranteed, so it is best to treat global investing as a diversifying part of an overall plan rather than a core holding.' },
          { q: 'How liquid are global investments and can I bring the money back?', a: 'US-listed stocks and ETFs are generally liquid and can be sold during US market hours, after which proceeds can be repatriated to your Indian bank account. Repatriation follows RBI and banking procedures and may involve conversion costs, so factor in exchange rates and timelines when planning to withdraw.' },
        ],
      },
    ],
  },
  {
    id: 'newissues',
    name: 'New Issues & Retirement',
    tagline: 'Get in early on IPOs and NFOs, and plan for retirement.',
    icon: 'newissues',
    products: [
      {
        slug: 'ipo',
        name: 'IPO',
        href: '/ipo',
        blurb: 'Apply for new company listings on NSE and BSE at the issue price.',
        faqs: [
          { q: 'What is an IPO in simple terms?', a: 'An IPO, or Initial Public Offering, is when a private company sells its shares to the public for the first time and lists on the NSE or BSE. You can apply at the issue price during the subscription window, and later trade the shares on the exchange.' },
          { q: 'How do I apply for an IPO online?', a: 'You apply through your trading or bank account using the ASBA framework, where the application amount is blocked in your bank account rather than debited. For retail investors this is typically done by approving a UPI mandate on your UPI app, which blocks the funds until allotment.' },
          { q: 'What does ASBA mean and why is it used?', a: 'ASBA stands for Application Supported by Blocked Amount. It means your money stays in your bank account and is only blocked, not debited, until shares are actually allotted; if you get no allotment the block is released automatically. It is the SEBI-mandated way to apply for IPOs.' },
          { q: 'What is the cut-off price in an IPO?', a: 'Cut-off price means you agree to accept whatever final issue price the company sets within the announced price band. Retail investors usually bid at cut-off so their application stays valid regardless of where the final price lands within the band.' },
          { q: 'What is a lot size and how many lots can I bid for?', a: 'A lot is the minimum number of shares you must apply for, fixed by the company and disclosed in the Red Herring Prospectus. Retail individual investors must bid for at least one lot and can bid in multiples of a lot up to an application value of Rs.2 lakh.' },
          { q: 'How is IPO allotment decided if the issue is oversubscribed?', a: 'When retail demand exceeds the shares reserved for that category, allotment is done by a computerised lottery, so every valid single-lot application has an equal chance regardless of size. The registrar publishes a basis-of-allotment document showing exactly how shares were distributed.' },
          { q: 'What happens to my money if I do not get an allotment?', a: 'Under ASBA, the amount blocked in your bank account is simply unblocked and becomes available again, usually around the allotment date. No separate refund request is needed, and no money leaves your account unless shares are allotted to you.' },
          { q: 'Do I need a Demat account to apply for an IPO?', a: 'Yes. Allotted IPO shares are credited in electronic form to your Demat account, so an active Demat account is mandatory to apply. You also need a PAN and a bank account that supports ASBA or UPI for the payment side.' },
          { q: 'What is the difference between a mainboard IPO and an SME IPO?', a: 'Mainboard IPOs are from larger companies that meet higher SEBI thresholds and list on the NSE or BSE main platforms. SME IPOs are from smaller companies listing on the BSE SME or NSE Emerge platforms, with lower entry requirements, larger minimum lot values, lighter regulatory scrutiny, and often thinner post-listing liquidity.' },
          { q: 'Should I invest for listing gains or for the long term?', a: 'Listing gains are the profit if the share lists above the issue price, but they are never guaranteed and a weakly priced IPO can list at a loss. If the company\'s fundamentals are strong, holding beyond listing can be more rewarding than exiting on day one; decide based on valuation and your own goals, not hype.' },
          { q: 'What is the grey market premium and should I rely on it?', a: 'The grey market premium, or GMP, is an unofficial price at which IPO shares are traded before listing, and it reflects sentiment rather than fundamentals. It operates entirely outside SEBI\'s regulatory framework, can be manipulated, and is not endorsed as a basis for investing; treat it only as a rough reference point.' },
          { q: 'How are gains from IPO shares taxed in India?', a: 'Gains on listed IPO shares sold within 12 months are treated as short-term capital gains, and gains on shares held longer are long-term. Following the 2024 Budget, short-term gains are taxed at 20% and long-term gains at 12.5%, with long-term gains up to Rs.1.25 lakh per financial year exempt; you must disclose all such gains in your income tax return.' },
        ],
      },
      {
        slug: 'nfo',
        name: 'NFO',
        href: '/nfo',
        blurb: 'Subscribe to newly launched mutual fund schemes at their initial offer price.',
        faqs: [
          { q: 'What is an NFO in mutual funds?', a: 'An NFO, or New Fund Offer, is the first subscription period during which a newly launched mutual fund scheme is offered to investors by an Asset Management Company. Units are usually offered at a face value of Rs.10, and the fund manager begins investing per the scheme\'s stated mandate once the window closes.' },
          { q: 'How is an NFO different from an existing mutual fund?', a: 'An existing fund has a track record, a live NAV, and past performance you can analyse, whereas an NFO is brand new with no history to evaluate. This means an NFO must be judged on the AMC\'s reputation, the fund manager\'s credentials, and the scheme mandate rather than on returns.' },
          { q: 'Is an NFO cheaper because units cost Rs.10?', a: 'No. The Rs.10 offer price is just a SEBI-standardised starting point and does not make the fund undervalued or a bargain. What matters is the quality of the underlying portfolio and strategy, not the entry price, since an existing fund at a higher NAV can be just as good or better.' },
          { q: 'Is an NFO the same as an IPO?', a: 'No. An IPO is issued by a company selling its own shares to raise capital, giving you direct equity in that company. An NFO is launched by a mutual fund house to introduce a new scheme, and you receive units in a professionally managed pooled fund, not shares of a single company.' },
          { q: 'What is the difference between open-ended and close-ended NFOs?', a: 'An open-ended NFO has no fixed maturity, and after the offer you can buy or redeem units at the prevailing NAV on any business day, though exit loads may apply for early redemptions. A close-ended NFO has a fixed tenure, typically three to five years, with no direct redemption from the AMC during that period; units are listed on the exchange as the only exit route.' },
          { q: 'Does an NFO have a lock-in period?', a: 'It depends on the type. Open-ended NFOs generally have no lock-in, close-ended NFOs lock your capital until maturity, and ELSS NFOs carry a mandatory three-year lock-in per instalment because they offer Section 80C tax benefits.' },
          { q: 'How do I evaluate an NFO before investing?', a: 'Since there is no past NAV data, assess the AMC\'s reputation and the fund manager\'s experience, read the Scheme Information Document to understand the objective and asset allocation, and compare the expense ratio against similar existing funds. Prioritise schemes that fit your long-term goals over those chasing a short-term market theme.' },
          { q: 'What is the minimum amount to invest in an NFO?', a: 'Most NFOs allow a minimum lump-sum investment of around Rs.500 to Rs.5,000, and about Rs.500 per instalment for SIP. The exact minimum is specified in each scheme\'s Scheme Information Document.' },
          { q: 'Can I invest in an NFO through SIP?', a: 'Some open-ended NFOs allow you to register a SIP during or after the subscription period. Most close-ended NFOs, however, are available only as a one-time lump-sum investment during the offer window.' },
          { q: 'What happens after the NFO subscription window closes?', a: 'For an open-ended fund, the scheme reopens for continuous purchase and redemption at the prevailing NAV after units are allotted. For a close-ended fund, the units are listed on the stock exchange and no direct AMC transactions are possible until maturity.' },
          { q: 'What are the main risks of investing in an NFO?', a: 'The biggest risk is the absence of any performance history, so you cannot analyse past returns, rolling returns, or risk ratios before committing. Close-ended NFOs also restrict access to your money until maturity, and open-ended ones may charge exit loads on early redemptions.' },
          { q: 'How are gains from an NFO taxed in India?', a: 'Taxation follows the underlying fund category and your holding period, not the fact that it was an NFO. Equity-oriented schemes held 12 months or more attract 12.5% long-term capital gains tax on gains above Rs.1.25 lakh, while non-equity schemes are taxed differently; tax rules can change, so confirm the latest provisions or consult a tax adviser.' },
        ],
      },
      {
        slug: 'nps',
        name: 'National Pension Scheme (NPS)',
        href: '/nps',
        blurb: 'A PFRDA-regulated, market-linked retirement scheme with an exclusive extra tax deduction.',
        faqs: [
          { q: 'What is the National Pension System (NPS)?', a: 'NPS is a voluntary, long-term retirement savings scheme regulated by the Pension Fund Regulatory and Development Authority (PFRDA). You contribute during your working years, the money is invested by professional pension fund managers in a market-linked mix of equity and debt, and it builds a corpus that provides a lump sum and a lifelong pension at retirement.' },
          { q: 'Who is eligible to open an NPS account?', a: 'Any Indian citizen between 18 and 70 years of age, whether resident or non-resident, can open an NPS account. It is open to salaried employees, self-employed individuals, and NRIs, and requires a PAN, KYC, and a bank account.' },
          { q: 'What is the difference between Tier I and Tier II accounts?', a: 'Tier I is the primary retirement account with restricted withdrawals and tax benefits, and it is the account for which a PRAN is issued. Tier II is a voluntary, savings-style add-on with full withdrawal flexibility and no lock-in, but no tax benefit for most subscribers; you need an active Tier I account to open a Tier II.' },
          { q: 'What is a PRAN?', a: 'PRAN stands for Permanent Retirement Account Number, a unique 12-digit number assigned to every NPS subscriber. It stays with you for life and remains unchanged even if you switch jobs, employers, or cities, making the account fully portable.' },
          { q: 'What tax benefits does NPS offer?', a: 'Your own Tier I contributions qualify for deduction under Section 80CCD(1) within the overall Rs.1.5 lakh limit of Section 80C. On top of that, Section 80CCD(1B) gives an exclusive additional deduction of up to Rs.50,000, and Section 80CCD(2) allows a separate deduction on your employer\'s contribution.' },
          { q: 'How does the extra Rs.50,000 deduction under 80CCD(1B) work?', a: 'Section 80CCD(1B) is a deduction available only for NPS, over and above the Rs.1.5 lakh ceiling of Section 80C. This lets you claim up to an additional Rs.50,000 on your own Tier I contributions, effectively raising your total possible deduction on personal contributions to Rs.2 lakh.' },
          { q: 'What is the difference between Active Choice and Auto Choice?', a: 'Under Active Choice you decide the split across the asset classes yourself, within regulatory caps, and can change it as your risk appetite shifts. Under Auto Choice a lifecycle fund manages the allocation for you, automatically shifting from equity to debt as you grow older, with Aggressive, Moderate, and Conservative variants.' },
          { q: 'What are the asset classes E, C, G and A in NPS?', a: 'E is Equity, investing in stocks for long-term growth; C is Corporate Debt, investing in company and institutional bonds; G is Government Securities, the lowest-risk class backed by sovereign issuers; and A is Alternative Assets such as REITs, InvITs and AIFs, available only under Active Choice and capped at 5%.' },
          { q: 'How much of my money can go into equity?', a: 'Under most schemes, equity allocation in NPS is capped at 75% of your contributions until around age 50, after which it tapers with age. This cap applies whether you use Active Choice or the aggressive lifecycle option under Auto Choice.' },
          { q: 'What are the withdrawal rules when I turn 60?', a: 'On maturity at 60, you can withdraw up to 60% of the corpus as a lump sum, which is currently tax-free in your hands. The remaining amount, at least 40%, must be used to buy an annuity that pays a regular pension.' },
          { q: 'Why is buying an annuity mandatory in NPS?', a: 'NPS is designed to fund a lifelong pension, so at least 40% of the corpus at 60 must be used to purchase an annuity from a PFRDA-empanelled insurer, which then pays you a regular income for life. If you exit before 60, the annuity requirement is higher, with at least 80% of the corpus going towards an annuity.' },
          { q: 'Can I withdraw money from NPS before retirement?', a: 'Tier I allows limited partial withdrawals of up to 25% of your own contributions after three years, but only for specified needs such as children\'s education, marriage, buying a home, or medical treatment. A full early exit before 60 requires at least 80% of the corpus to be used for an annuity, so NPS is best treated as a dedicated retirement allocation.' },
        ],
      },
    ],
  },
  {
    id: 'loans',
    name: 'Loans Against Securities',
    tagline: 'Unlock liquidity from your holdings without selling them.',
    icon: 'loans',
    products: [
      {
        slug: 'loan-against-mutual-fund',
        name: 'Loan Against Mutual Funds',
        href: '/loan-against-mutual-fund',
        blurb: 'Borrow against your mutual fund units without redeeming them.',
        faqs: [
          { q: 'What is a Loan Against Mutual Funds?', a: 'A Loan Against Mutual Funds is a secured credit facility where you pledge your mutual fund units as collateral to borrow funds, without redeeming them. A lien is marked on the pledged units through the registrar (CAMS or KFintech) and you receive a loan or overdraft limit based on the current value of your eligible portfolio, while your units stay invested.' },
          { q: 'How does a Loan Against Mutual Funds work as a credit line?', a: 'It is usually offered as an overdraft facility against a sanctioned limit, so you can withdraw funds as and when you need them rather than taking the full amount upfront. Interest is charged only on the amount you actually use, and you can repay and redraw within the limit during the loan tenure.' },
          { q: 'Do I have to sell my mutual funds to get the loan?', a: 'No. The whole point of the facility is that you borrow against your units instead of selling them, so you stay invested. Your units remain in your folio and continue to participate in market movements while they are pledged.' },
          { q: 'How are the units pledged?', a: 'The units are pledged by marking a lien in favour of the lender through the mutual fund registrar and transfer agent (RTA), typically CAMS or KFintech, using your PAN. The process is digital and authorised online, so no physical paperwork or transfer of units to another account is required.' },
          { q: 'How much can I borrow against my mutual funds?', a: 'The amount depends on the applicable Loan-to-Value (LTV) ratio for the type of fund pledged, the current value of your eligible holdings, and the lender\'s credit assessment. Debt funds generally attract a higher LTV than equity funds because they are less volatile; the exact limit is confirmed in your sanction terms.' },
          { q: 'What is a margin shortfall or margin call?', a: 'If the market value of your pledged units falls so that your outstanding loan exceeds the permitted LTV, the lender may raise a margin call asking you to restore the margin. You can typically respond by pledging additional eligible units or by partially repaying the loan within the given timeframe.' },
          { q: 'What happens if I do not meet a margin call?', a: 'If the shortfall is not cured within the specified period, the lender may invoke the pledge and redeem part of your pledged units to recover the outstanding dues. This is a protective last resort rather than a routine action, so it helps to keep a buffer and respond promptly to any margin call.' },
          { q: 'Who is eligible for a Loan Against Mutual Funds?', a: 'The facility is generally available to resident Indian individuals who are of eligible age, hold valid KYC and a PAN, and own mutual fund units on the lender\'s approved scheme list that meet a minimum eligible portfolio value. Final eligibility is subject to the lender\'s policies and credit assessment.' },
          { q: 'Which mutual funds are eligible to be pledged?', a: 'Only schemes on the lender\'s approved list qualify, typically open-ended equity and debt funds, index funds and fund of funds. Categories such as close-ended schemes, funds within an ELSS lock-in, and gold or silver-linked funds are usually not eligible; your live portfolio is fetched via PAN so you can select which eligible units to pledge.' },
          { q: 'Do I still receive dividends and returns while my units are pledged?', a: 'Yes. The lien only restricts your ability to redeem, switch or transfer the units; it does not affect their economic returns. Any NAV appreciation, dividends and bonus units continue to accrue to your folio while the lien is active, and full control is restored once the loan is repaid and the lien is released.' },
          { q: 'What is the tenure, and can it be renewed?', a: 'A Loan Against Mutual Funds is typically sanctioned as a revolving facility for a set period, commonly around twelve months, and can usually be renewed subject to the lender\'s review and terms. You can continue to draw and repay within your limit during the tenure.' },
          { q: 'Are there prepayment or foreclosure charges, and what does the loan cost?', a: 'Interest is levied only on the amount utilised at the rate stated in your sanction terms, and processing or other fees apply as applicable. Prepayment and foreclosure terms are set in your sanction letter and Key Fact Statement, so review those documents for the exact charges before you apply.' },
        ],
      },
      {
        slug: 'loan-against-shares',
        name: 'Loan Against Stocks',
        href: '/loan-against-shares',
        blurb: 'Unlock liquidity against your shares while staying invested.',
        faqs: [
          { q: 'What is a Loan Against Stocks?', a: 'A Loan Against Stocks is a secured credit facility that lets you borrow funds by pledging eligible shares held in your Demat account, while you continue to own them. A credit limit is set against the value of your pledged securities, so you can raise money without selling your holdings.' },
          { q: 'How does it work as an overdraft or credit line?', a: 'It works like an overdraft against a sanctioned limit, so you withdraw funds only when you need them instead of taking the whole amount at once. Interest is charged only on the amount you actually draw, and you can repay and redraw within the limit during the loan tenure.' },
          { q: 'Do I lose ownership of my shares after pledging them?', a: 'No. The shares stay in your Demat account and you remain the owner throughout the loan; only a lien is marked on them in favour of the lender. You continue to receive corporate benefits such as dividends, bonus issues and stock splits, subject to applicable terms.' },
          { q: 'How are the shares pledged?', a: 'Shares are pledged by marking a lien through the depository system, and you authorise the pledge digitally, usually via an OTP. SEBI-regulated depositories such as NSDL and CDSL operate this electronic pledge mechanism, and the securities remain in your own Demat account rather than being transferred away.' },
          { q: 'How much can I borrow against my shares?', a: 'The amount depends on the market value of the pledged shares and the applicable Loan-to-Value (LTV) ratio, subject to regulatory limits. Lenders commonly fund up to around half the value of eligible equity shares, with the exact limit confirmed in your sanction terms.' },
          { q: 'Which shares and securities are eligible?', a: 'Only securities on the lender\'s approved scrip list can be pledged, and regulators require them to be exchange-listed, liquid and independently valued. Eligible securities typically include selected large-cap and mid-cap equities, certain ETFs and specified instruments, chosen on the basis of liquidity, market capitalisation and risk.' },
          { q: 'What is the Loan-to-Value (LTV) ratio and why does it matter?', a: 'The LTV ratio is the loan amount expressed as a percentage of the market value of your pledged shares. It helps manage risk for both borrower and lender, because if share prices fall, your effective LTV rises, and keeping a comfortable buffer below the permitted limit reduces the chance of a margin call.' },
          { q: 'What happens if the value of my pledged shares falls?', a: 'If the value of your pledged shares declines significantly and pushes your LTV beyond the permitted limit, the lender may issue a margin call. You can restore the required margin by pledging additional approved shares, making a partial repayment, or, subject to approval, swapping in other eligible securities.' },
          { q: 'What happens if I do not respond to a margin call?', a: 'If the margin shortfall is not addressed within the specified period, the lender may invoke the pledge and sell enough of the pledged securities to recover the outstanding dues. After the dues are settled from the sale proceeds the loan account is closed, and any remaining shares are unpledged and returned to you.' },
          { q: 'Who is eligible for a Loan Against Stocks?', a: 'The facility is generally available to resident Indian individuals of eligible age with an active Demat account, valid KYC with PAN and Aadhaar, and approved shares meeting a minimum portfolio value. Applicants such as minors, HUFs, NRIs, and promoters or directors pledging shares of their own companies are typically not eligible.' },
          { q: 'Can I get my shares back and how do prepayment and renewal work?', a: 'Once you fully repay the borrowed amount, the lien is removed and your shares are unpledged and returned to your Demat account, restoring full control. The facility is usually sanctioned as a renewable revolving limit, and foreclosure and prepayment terms are set out in your sanction documents.' },
          { q: 'What does a Loan Against Stocks cost?', a: 'Interest is charged only on the amount you utilise at the rate stated in your sanction terms, and charges such as a processing fee, penal interest on overdue amounts and any swap fee apply as applicable. Simply pledging shares does not trigger capital gains tax, since no sale takes place; refer to your sanction letter for the exact charges.' },
        ],
      },
    ],
  },
];

/** Flattened { question, answer } list for the FAQPage JSON-LD. */
export const allFaqEntries = faqCategories.flatMap((c) =>
  c.products.flatMap((p) => p.faqs.map((f) => ({ question: f.q, answer: f.a })))
);

/** Total FAQ count across every product (for hero/marketing copy). */
export const faqCount = allFaqEntries.length;
