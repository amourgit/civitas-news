"use client";

import * as React from "react";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import "./AnimatedTabBar.css";

export interface TabItem {
  icon: React.ReactNode;
  color: string;
}

export interface AnimatedTabBarProps {
  items: TabItem[];
  defaultIndex?: number;
  onTabChange?: (index: number) => void;
}

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  items,
  defaultIndex = 0,
  onTabChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const menuRef = useRef<HTMLMenuElement>(null);
  const menuBorderRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Resynchronise l'onglet actif quand `defaultIndex` change pour une
  // raison EXTERNE (lien ailleurs dans l'app, bouton retour du
  // navigateur) — SANS jamais démonter ce composant (voir MobileDock.tsx,
  // qui ne force plus de remount via `key`). Le curseur glisse donc
  // toujours depuis sa position réelle actuelle vers la nouvelle cible :
  // un démontage/remontage aurait recréé le bandeau depuis son état CSS
  // par défaut (celui du tout premier onglet), d'où le bug où le
  // déplacement semblait toujours repartir de "Home" au lieu du dernier
  // onglet réellement actif.
  useEffect(() => {
    setActiveIndex(defaultIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultIndex]);

  const offsetMenuBorder = useCallback(() => {
    const activeItem = itemRefs.current[activeIndex];
    const menu = menuRef.current;
    const menuBorder = menuBorderRef.current;
    if (activeItem && menu && menuBorder) {
      const offsetActiveItem = activeItem.getBoundingClientRect();
      const left = Math.floor(
        offsetActiveItem.left -
          menu.offsetLeft -
          (menuBorder.offsetWidth - offsetActiveItem.width) / 2
      );
      menuBorder.style.transform = `translate3d(${left}px, 0, 0)`;
    }
  }, [activeIndex]);

  useLayoutEffect(() => {
    offsetMenuBorder();
    const handleResize = () => {
      if (menuRef.current) {
        // Use a more specific way to access style property
        const menuStyle = menuRef.current.style;
        menuStyle.setProperty("--timeOut", "none");
      }
      offsetMenuBorder();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [offsetMenuBorder]);

  const handleItemClick = (index: number) => {
    if (menuRef.current) {
      const menuStyle = menuRef.current.style;
      menuStyle.removeProperty("--timeOut");
    }
    if (activeIndex === index) return;
    setActiveIndex(index);
    if (onTabChange) {
      onTabChange(index);
    }
  };

  return (
    <menu className="menu" ref={menuRef}>
      {items.map((item, index) => (
        <button
          key={index}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          className={`menu__item ${activeIndex === index ? "active" : ""}`}
          style={{ "--bgColorItem": item.color } as React.CSSProperties}
          onClick={() => handleItemClick(index)}
          aria-label={`Tab ${index + 1}`}
        >
          {item.icon}
        </button>
      ))}
      <div className="menu__border" ref={menuBorderRef}></div>
    </menu>
  );
};
