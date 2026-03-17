import { useTranslation } from "react-i18next"

export function IconPackStudio() {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold tracking-tight">{t("iconPack.studio")}</h2>
      <p className="text-muted-foreground">{t("iconPack.studioDesc")}</p>
    </div>
  )
}
