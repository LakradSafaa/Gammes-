import ReferentielPage from "./ReferentielPage";

export default function RisquesPage() {
  return (
    <ReferentielPage
      title="Risques"
      subtitle="Bibliothèque standard des risques de maintenance industrielle"
      endpoint="/risques"
      primaryField="nom"
      secondaryFields={["description"]}
      imageField="image_url"
      displayMode="cards"
      fields={[
        {
          name: "nom",
          label: "Nom",
          required: true,
          placeholder: "Ex. Risque électrique",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
        },
        {
          name: "image_url",
          label: "Image",
          placeholder: "risques/electrique.png",
        },
      ]}
    />
  );
}
