import React from "react";
import { navigate } from "raviger";
import Breadcrumbs from "./Breadcrumbs";
import PageHeadTitle from "./PageHeadTitle";

interface PageTitleProps {
  title: string;
  hideBack?: boolean;
  backUrl?: string;
  backButtonCB?: () => number | void;
  className?: string;
  componentRight?: React.ReactChild;
  breadcrumbs?: boolean;
  crumbsReplacements?: {
    [key: string]: { name?: string; uri?: string; style?: string };
  };
}

export default function PageTitle(props: PageTitleProps) {
  const {
    title,
    hideBack,
    backUrl,
    backButtonCB,
    className = "",
    componentRight = <></>,
    breadcrumbs = true,
    crumbsReplacements = {},
  } = props;

  const onBackButtonClick = () => {
    if (backButtonCB) {
      const goBack = backButtonCB();
      if (goBack) {
        window.history.go(goBack);
      }
    } else {
      backUrl ? navigate(backUrl) : window.history.go(-1);
    }
  };

  return (
    <div className={`pt-4 mb-4 ${className}`}>
      <PageHeadTitle title={title} />
      <div className="flex items-center">
        {!hideBack && (
          <button onClick={onBackButtonClick}>
            <i className="fas fa-chevron-left text-2xl rounded-md p-2 hover:bg-gray-200 mr-1">
              {" "}
            </i>
          </button>
        )}
        <h2 className="font-semibold text-2xl leading-tight ml-0">{title}</h2>
        {componentRight}
      </div>
      <div className={hideBack ? "my-2" : "ml-8 my-2"}>
        {breadcrumbs && <Breadcrumbs replacements={crumbsReplacements} />}
      </div>
    </div>
  );
}
