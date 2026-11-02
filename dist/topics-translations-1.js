/* Reviewed English and Dutch practical-language entries, aligned to the original
   German/Arabic rows by index. No automatic machine translation at runtime. */
(function(global){
'use strict';
const data={
  "hospital": {
    "title": [
      "Hospital",
      "Ziekenhuis",
      "Krankenhaus"
    ],
    "wEn": "the hospital|the emergency department|the doctor|the female doctor|the appointment|the health insurance card|pain|fever|the prescription|the pharmacy|the medication|the allergy",
    "wNl": "het ziekenhuis|de spoedeisende hulp|de arts|de vrouwelijke arts|de afspraak|de zorgverzekeringspas|de pijn|de koorts|het recept|de apotheek|het medicijn|de allergie",
    "pEn": "I need a doctor.|I am in severe pain.|I feel dizzy.|I have a fever.|Where is the emergency department?|I have an appointment at ten o'clock.|I am allergic to penicillin.|Could you speak more slowly, please?|I need an Arabic interpreter, please.|Please call an ambulance!",
    "pNl": "Ik heb een arts nodig.|Ik heb veel pijn.|Ik ben duizelig.|Ik heb koorts.|Waar is de spoedeisende hulp?|Ik heb om tien uur een afspraak.|Ik ben allergisch voor penicilline.|Kunt u alstublieft wat langzamer spreken?|Ik heb alstublieft een Arabische tolk nodig.|Bel alstublieft een ambulance!"
  },
  "train": {
    "title": [
      "At the train station",
      "Op het station",
      "Am Bahnhof"
    ],
    "wEn": "the train station|the train|the track|the platform|the ticket|the ticket machine|the timetable|the delay|the departure|the arrival|changing trains|the connecting train",
    "wNl": "het station|de trein|het spoor|het perron|het kaartje|de kaartautomaat|de dienstregeling|de vertraging|het vertrek|de aankomst|het overstappen|de aansluitende trein",
    "pEn": "Where can I buy a ticket?|Which platform does the train to Vienna leave from?|When does the next train leave?|Is the train delayed?|Do I need to change trains in Linz?|Is this the train to Salzburg?|Is this seat free?|I missed my connecting train.|Where is the ticket machine?|When will we arrive?",
    "pNl": "Waar kan ik een kaartje kopen?|Van welk spoor vertrekt de trein naar Wenen?|Wanneer vertrekt de volgende trein?|Heeft de trein vertraging?|Moet ik in Linz overstappen?|Is dit de trein naar Salzburg?|Is deze plaats vrij?|Ik heb mijn aansluiting gemist.|Waar is de kaartautomaat?|Wanneer komen we aan?"
  },
  "bus": {
    "title": [
      "On the bus",
      "In de bus",
      "Im Bus"
    ],
    "wEn": "the bus|the bus stop|the route number|the ticket|the monthly pass|the timetable|the departure|the last stop|the bus driver|the female bus driver|the delay|the travel ticket",
    "wNl": "de bus|de bushalte|de buslijn|het kaartje|het maandabonnement|de dienstregeling|het vertrek|de eindhalte|de buschauffeur|de vrouwelijke buschauffeur|de vertraging|het vervoersbewijs",
    "pEn": "Does this bus go to the train station?|Where is the nearest bus stop?|When is the next bus coming?|I would like to buy a ticket.|How much does the ticket cost?|Do I need to get off here?|Could you tell me when I need to get off?|Is this bus route 3?|Where can I buy a monthly pass?|Excuse me, is this seat free?",
    "pNl": "Gaat deze bus naar het station?|Waar is de dichtstbijzijnde bushalte?|Wanneer komt de volgende bus?|Ik wil graag een kaartje kopen.|Hoeveel kost het kaartje?|Moet ik hier uitstappen?|Kunt u mij zeggen wanneer ik moet uitstappen?|Is dit buslijn 3?|Waar kan ik een maandabonnement kopen?|Pardon, is deze plaats vrij?"
  },
  "kindergarten": {
    "title": [
      "At kindergarten",
      "Op de kleuterschool",
      "Im Kindergarten"
    ],
    "wEn": "the kindergarten|the registration|the educator|the settling-in period|the snack|the water bottle|spare clothes|indoor shoes|pick-up time|the trip|the sickness notification|the parents' evening",
    "wNl": "de kleuterschool|de inschrijving|de pedagogisch medewerker|de wenperiode|het tussendoortje|de drinkfles|de reservekleren|de binnenschoenen|de ophaaltijd|het uitstapje|de ziekmelding|de ouderavond",
    "pEn": "I would like to register my child at kindergarten.|Are there any places available?|When can I pick up my child?|My child is ill today and will not come.|Does my child need spare clothes?|Do I need to pack a snack?|Is there a trip tomorrow?|My child has a food allergy.|I would like to speak with the educator.|What time does childcare start?",
    "pNl": "Ik wil mijn kind graag aanmelden bij de kleuterschool.|Zijn er nog plaatsen beschikbaar?|Wanneer kan ik mijn kind ophalen?|Mijn kind is vandaag ziek en komt niet.|Heeft mijn kind reservekleren nodig?|Moet ik een tussendoortje meegeven?|Is er morgen een uitstapje?|Mijn kind heeft een voedselallergie.|Ik wil graag met de pedagogisch medewerker spreken.|Hoe laat begint de opvang?"
  },
  "school": {
    "title": [
      "At school",
      "Op school",
      "In der Schule"
    ],
    "wEn": "the school|the female teacher|the male teacher|homework|the school notebook|the schoolbag|the timetable|the class teacher|parents' consultation day|the report card|the absence note|the lesson",
    "wNl": "de school|de lerares|de leraar|het huiswerk|het schoolschrift|de schooltas|het lesrooster|de klassenlerares|het oudergesprek|het rapport|het briefje voor afwezigheid|de les",
    "pEn": "My child cannot come to school today.|What homework is due tomorrow?|When do classes start?|I would like to speak with the class teacher.|My child forgot the school notebook.|Is there a school trip tomorrow?|When is the next parents' consultation day?|Could you send me the timetable, please?|My child needs help with homework.|Where can I hand in an absence note?",
    "pNl": "Mijn kind kan vandaag niet naar school komen.|Welk huiswerk is er voor morgen?|Wanneer beginnen de lessen?|Ik wil graag met de klassenlerares spreken.|Mijn kind is het schoolschrift vergeten.|Is er morgen een schooluitstapje?|Wanneer is het volgende oudergesprek?|Kunt u mij het lesrooster sturen?|Mijn kind heeft hulp nodig bij het huiswerk.|Waar kan ik een briefje voor afwezigheid inleveren?"
  },
  "supermarket": {
    "title": [
      "At the supermarket",
      "In de supermarkt",
      "Im Supermarkt"
    ],
    "wEn": "the supermarket|the checkout|the receipt|the shopping trolley|the shopping list|the shelf|the price|the special offer|the change|the bank card|milk|the shopping bag",
    "wNl": "de supermarkt|de kassa|de kassabon|de winkelwagen|het boodschappenlijstje|het schap|de prijs|de aanbieding|het wisselgeld|de bankpas|de melk|de boodschappentas",
    "pEn": "Where can I find milk?|How much does this cost?|Is this on special offer?|Can I pay by card?|I would like to pay in cash.|Can I have a bag?|Where is the checkout?|I think the price is wrong.|Do you also have wholegrain bread?|Could I have the receipt, please?",
    "pNl": "Waar kan ik melk vinden?|Hoeveel kost dit?|Is dit in de aanbieding?|Kan ik met pin betalen?|Ik wil graag contant betalen.|Mag ik een tas?|Waar is de kassa?|Volgens mij klopt de prijs niet.|Heeft u ook volkorenbrood?|Mag ik alstublieft de kassabon?"
  },
  "everyday": {
    "title": [
      "Everyday situations",
      "Dagelijkse situaties",
      "Alltagssituationen"
    ],
    "wEn": "the apartment|the rent|the appointment|the government office|the form|the signature|the address|the bill|the key|help|the message|work",
    "wNl": "het appartement|de huur|de afspraak|de overheidsinstantie|het formulier|de handtekening|het adres|de rekening|de sleutel|de hulp|het bericht|het werk",
    "pEn": "Could you speak more slowly, please?|I don't understand everything.|Could you repeat that, please?|I am still learning German.|I need an appointment.|Where do I need to sign?|Could you help me, please?|I have a question about my bill.|I am looking for an apartment to rent.|How do I get to the town hall?",
    "pNl": "Kunt u alstublieft wat langzamer spreken?|Ik begrijp niet alles.|Kunt u dat alstublieft herhalen?|Ik ben nog Duits aan het leren.|Ik heb een afspraak nodig.|Waar moet ik tekenen?|Kunt u mij alstublieft helpen?|Ik heb een vraag over mijn rekening.|Ik zoek een appartement om te huren.|Hoe kom ik bij het gemeentehuis?"
  },
  "work": {
    "title": [
      "At work",
      "Op het werk",
      "Bei der Arbeit"
    ],
    "wEn": "the employment contract|the payslip|the work schedule|the shift|overtime hours|the break|annual leave|sick leave|time recording|the supervisor|termination of employment|the hourly wage",
    "wNl": "het arbeidscontract|de loonstrook|het werkrooster|de dienst|de overuren|de pauze|het verlof|het ziekteverlof|de urenregistratie|de leidinggevende|de opzegging|het uurloon",
    "pEn": "When does my shift start?|Could you send me the work schedule, please?|I have a question about my payslip.|How is my overtime paid?|I would like to request leave.|I am ill and cannot work today.|Where do I record my working hours?|Could you explain this task to me again?|When is my break?|Who can I contact if I have questions?",
    "pNl": "Wanneer begint mijn dienst?|Kunt u mij alstublieft het werkrooster sturen?|Ik heb een vraag over mijn loonstrook.|Hoe worden mijn overuren betaald?|Ik wil graag verlof aanvragen.|Ik ben ziek en kan vandaag niet werken.|Waar moet ik mijn werkuren registreren?|Kunt u deze taak nog een keer uitleggen?|Wanneer heb ik pauze?|Bij wie kan ik terecht met vragen?"
  },
  "ams": {
    "title": [
      "At the employment office",
      "Bij het arbeidsbureau",
      "Beim AMS und Ämtern"
    ],
    "wEn": "the employment service (AMS)|unemployment benefit|emergency assistance|unemployment registration|the application|the official decision|the appointment|job placement|the support agreement|the documents|proof of residence|the form",
    "wNl": "de arbeidsbemiddelingsdienst (AMS)|de werkloosheidsuitkering|de noodsteun|de werkloosheidsmelding|de aanvraag|de officiële beschikking|de afspraak|de arbeidsbemiddeling|de begeleidingsovereenkomst|de documenten|het bewijs van inschrijving|het formulier",
    "pEn": "I would like to register as unemployed.|I have an appointment at AMS.|What documents do I need to bring?|I would like to report my new job.|Can I reschedule my appointment?|I have a question about my unemployment benefit.|Is my application complete?|I received a letter from AMS.|Can you explain the decision to me?|I would like to attend a German course.",
    "pNl": "Ik wil mij graag als werkloos inschrijven.|Ik heb een afspraak bij het AMS.|Welke documenten moet ik meenemen?|Ik wil mijn nieuwe baan melden.|Kan ik mijn afspraak verplaatsen?|Ik heb een vraag over mijn werkloosheidsuitkering.|Is mijn aanvraag compleet?|Ik heb een brief van het AMS ontvangen.|Kunt u mij de beschikking uitleggen?|Ik wil graag een cursus Duits volgen."
  },
  "pharmacy": {
    "title": [
      "At the pharmacy",
      "Bij de apotheek",
      "In der Apotheke"
    ],
    "wEn": "the pharmacy|the prescription|the medicine|the tablet|the ointment|the drops|the package leaflet|the side effect|the dosage|the plaster|the cough syrup|the allergy",
    "wNl": "de apotheek|het recept|het medicijn|de tablet|de zalf|de druppels|de bijsluiter|de bijwerking|de dosering|de pleister|de hoestsiroop|de allergie",
    "pEn": "I would like to fill this prescription.|Is this medicine prescription-only?|How often should I take these tablets?|Should I take the medicine before or after eating?|Does this medicine have side effects?|I have a penicillin allergy.|Is this medicine also available for children?|How should I store the drops?|I need a plaster.|Can you explain the package leaflet to me?",
    "pNl": "Ik wil graag dit recept inleveren.|Is dit medicijn alleen op recept verkrijgbaar?|Hoe vaak moet ik deze tabletten innemen?|Moet ik dit medicijn voor of na het eten innemen?|Heeft dit medicijn bijwerkingen?|Ik ben allergisch voor penicilline.|Is dit medicijn ook voor kinderen verkrijgbaar?|Hoe moet ik de druppels bewaren?|Ik heb een pleister nodig.|Kunt u mij de bijsluiter uitleggen?"
  }
};
global.WORT_TOPICS_TRANSLATIONS=Object.assign(global.WORT_TOPICS_TRANSLATIONS||{},data);
})(globalThis);
