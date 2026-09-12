import ReferentielPage from "./ReferentielPage";

export default function OutillagesPage() {
  return (
    <ReferentielPage
      title="Outillages"
      subtitle="Référentiel des moyens et outils de maintenance"
      endpoint="/outillages"
      primaryField="nom"
      secondaryFields={["description"]}
      displayMode="list"
      fields={[
        {
          name: "nom",
          label: "Nom",
          required: true,
          placeholder: "Ex. Clé dynamométrique",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
        },
        {
          name: "image_url",
          label: "Image",
          placeholder: "outillages/cle-dynamometrique.png",
        },
      ]}
    />
  );
}
