import ReferentielPage from "./ReferentielPage";

export default function EPIPage() {
  return (
    <ReferentielPage
      title="EPI"
      subtitle="Référentiel des équipements de protection individuelle"
      endpoint="/epis"
      primaryField="nom"
      secondaryFields={["description"]}
      imageField="image_url"
      displayMode="cards"
      fields={[
        {
          name: "nom",
          label: "Nom",
          required: true,
          placeholder: "Ex. Gants anti-coupure",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
        },
        {
          name: "image_url",
          label: "Image",
          placeholder: "epis/gants-anticoupure.png",
        },
      ]}
    />
  );
}
