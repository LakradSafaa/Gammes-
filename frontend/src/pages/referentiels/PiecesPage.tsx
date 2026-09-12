import ReferentielPage from "./ReferentielPage";

export default function PiecesPage() {
  return (
    <ReferentielPage
      title="Pièces de rechange"
      subtitle="Catalogue standard des pièces de maintenance"
      endpoint="/pieces"
      primaryField="nom"
      secondaryFields={[
        "code",
        "constructeur",
        "reference",
        "description",
      ]}
      displayMode="list"
      fields={[
        {
          name: "code",
          label: "Code",
          placeholder: "Ex. BASE-MEC-001",
        },
        {
          name: "nom",
          label: "Nom",
          required: true,
          placeholder: "Ex. Roulement",
        },
        {
          name: "constructeur",
          label: "Constructeur",
        },
        {
          name: "reference",
          label: "Référence constructeur",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
        },
        {
          name: "image_url",
          label: "Image",
          placeholder: "pieces/roulement.png",
        },
      ]}
    />
  );
}
