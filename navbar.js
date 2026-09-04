/*--------------------
Navbar JS
--------------------*/

export function initNavbar() {
  const navComponents = document.querySelectorAll("[data-navbar-component]");
  if (!navComponents.length) return;

  const desktopMQ = window.matchMedia("(min-width: 992px)");
  const mobileMQ = window.matchMedia("(max-width: 991px)");

  navComponents.forEach((nav, navIndex) => {
    const toggles = [...nav.querySelectorAll("[data-dropdown-toggle]")];
    const panels = [...nav.querySelectorAll("[data-dropdown-content]")];
    const dropdownBackground = nav.querySelector("[data-dropdown-background]");
    const mobileMenuToggle = nav.querySelector("[data-mobile-menu-open]");
    const navMenu = nav.querySelector("[data-nav-menu]");
    const mobileMenuCloseButtons = [...nav.querySelectorAll("[data-mobile-menu-close]")];
    const mobileMenuBackground = nav.querySelector("[data-menu-background]");
    const mobileDropdownBackButtons = [...nav.querySelectorAll("[data-mobile-dropdown-close]")];

    if (!toggles.length || !panels.length) return;

    let activeDropdown = null;
    let activeMobileSubmenu = null;
    const panelTimelines = new Map();
    const mobilePanelTimelines = new Map();
    let backgroundTimeline = null;
    let isMobileMenuOpen = false;
    let isMobileContextActive = false;
    let mobileMenuTimeline = null;
    let mobileMenuBackgroundTimeline = null;

    const mobileMM = gsap.matchMedia();

    const focusableSelector = [
      "a[href]",
      "area[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "iframe",
      "object",
      "embed",
      "[contenteditable='true']",
      "[tabindex]"
    ].join(",");

    function getPanelByName(name) {
      return panels.find((panel) => {
        return panel.getAttribute("data-dropdown-content") === name;
      });
    }

    function getToggleByName(name) {
      return toggles.find((toggle) => {
        return toggle.getAttribute("data-dropdown-toggle") === name;
      });
    }

    function getIconByName(name) {
      const toggle = getToggleByName(name);
      if (!toggle) return null;

      return toggle.querySelector("[data-desktop-dropdown-icon]");
    }

    function getNextToggle(name) {
      const currentIndex = toggles.findIndex((toggle) => {
        return toggle.getAttribute("data-dropdown-toggle") === name;
      });

      if (currentIndex === -1) return null;

      return toggles[currentIndex + 1] || null;
    }

    function createSafeId(value) {
      return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    function isElementVisible(element) {
      return !!(
        element.offsetWidth ||
        element.offsetHeight ||
        element.getClientRects().length
      );
    }

    function getPotentialFocusableElements(container) {
      if (!container) return [];

      return [...container.querySelectorAll(focusableSelector)].filter((element) => {
        return !element.hasAttribute("disabled") && !element.closest("[inert]");
      });
    }

    function getFocusableElements(container) {
      return getPotentialFocusableElements(container).filter((element) => {
        const style = window.getComputedStyle(element);

        return (
          isElementVisible(element) &&
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getAttribute("tabindex") !== "-1"
        );
      });
    }

    function storeOriginalTabindex(element) {
      if (element.hasAttribute("data-navbar-original-tabindex")) return;

      const originalTabindex = element.getAttribute("tabindex");

      element.setAttribute(
        "data-navbar-original-tabindex",
        originalTabindex === null ? "" : originalTabindex
      );
    }

    function setPanelFocusability(panel, isFocusable) {
      const focusableElements = getPotentialFocusableElements(panel);

      focusableElements.forEach((element) => {
        storeOriginalTabindex(element);

        if (!isFocusable) {
          element.setAttribute("tabindex", "-1");
          return;
        }

        const originalTabindex = element.getAttribute("data-navbar-original-tabindex");

        if (originalTabindex === "") {
          element.removeAttribute("tabindex");
        } else {
          element.setAttribute("tabindex", originalTabindex);
        }
      });
    }

    function focusFirstDropdownItem(name) {
      const panel = getPanelByName(name);
      if (!panel) return false;

      const focusableElements = getFocusableElements(panel);
      if (!focusableElements.length) return false;

      focusableElements[0].focus();
      return true;
    }

    function focusToggle(name) {
      const toggle = getToggleByName(name);

      if (toggle) {
        toggle.focus();
      }
    }

    function setPanelOpen(panel) {
      panel.setAttribute("aria-hidden", "false");
      setPanelFocusability(panel, true);

      gsap.set(panel, {
        position: "relative",
        pointerEvents: "auto"
      });
    }

    function setPanelClosed(panel) {
      panel.setAttribute("aria-hidden", "true");
      setPanelFocusability(panel, false);

      gsap.set(panel, {
        position: "absolute",
        autoAlpha: 0,
        yPercent: 10,
        pointerEvents: "none"
      });
    }

    function setToggleActive(name) {
      const toggle = getToggleByName(name);
      if (!toggle) return;

      gsap.to(toggle, {
        backgroundColor: "rgba(1, 10, 14, 0.3)",
        duration: 0.25,
        ease: "power2.out",
        overwrite: true
      });
    }

    function setToggleInactive(name, immediate = false) {
      const toggle = getToggleByName(name);
      if (!toggle) return;

      if (immediate) {
        gsap.set(toggle, {
          clearProps: "backgroundColor"
        });

        return;
      }

      gsap.to(toggle, {
        backgroundColor: "rgba(1, 10, 14, 0)",
        duration: 0.25,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => {
          gsap.set(toggle, {
            clearProps: "backgroundColor"
          });
        }
      });
    }

    function rotateIconOpen(name) {
      const icon = getIconByName(name);
      if (!icon) return;

      gsap.to(icon, {
        rotate: 45,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true
      });
    }

    function rotateIconClosed(name, immediate = false) {
      const icon = getIconByName(name);
      if (!icon) return;

      if (immediate) {
        gsap.set(icon, {
          rotate: 0
        });

        return;
      }

      gsap.to(icon, {
        rotate: 0,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true
      });
    }

    function setupAccessibility() {
      toggles.forEach((toggle, index) => {
        const name = toggle.getAttribute("data-dropdown-toggle");
        const panel = getPanelByName(name);

        if (!panel) return;

        const safeName = createSafeId(name || `dropdown-${index}`);

        if (!toggle.id) {
          toggle.id = `navbar-dropdown-toggle-${navIndex}-${safeName}-${index}`;
        }

        if (!panel.id) {
          panel.id = `navbar-dropdown-panel-${navIndex}-${safeName}-${index}`;
        }

        toggle.setAttribute("aria-controls", panel.id);
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-haspopup", "true");

        panel.setAttribute("aria-hidden", "true");
        panel.setAttribute("aria-labelledby", toggle.id);

        if (!toggle.matches("button, a, input, select, textarea")) {
          toggle.setAttribute("role", "button");

          if (!toggle.hasAttribute("tabindex")) {
            toggle.setAttribute("tabindex", "0");
          }
        }

        setPanelFocusability(panel, false);
      });
    }

    function setupAnimations() {
      panels.forEach((panel) => {
        const name = panel.getAttribute("data-dropdown-content");

        setPanelClosed(panel);

        const timeline = gsap.timeline({
          paused: true,
          defaults: {
            duration: 0.35,
            ease: "power2.out"
          },
          onStart: () => {
            setPanelOpen(panel);
          },
          onReverseComplete: () => {
            setPanelClosed(panel);
          }
        });

        timeline.to(panel, {
          autoAlpha: 1,
          yPercent: 0
        });

        panelTimelines.set(name, timeline);
      });

      toggles.forEach((toggle) => {
        const icon = toggle.querySelector("[data-desktop-dropdown-icon]");

        if (!icon) return;

        gsap.set(icon, {
          rotate: 0,
          transformOrigin: "50% 50%"
        });
      });

      if (dropdownBackground) {
        gsap.set(dropdownBackground, {
          autoAlpha: 0,
          yPercent: 10,
          pointerEvents: "none"
        });

        backgroundTimeline = gsap.timeline({
          paused: true,
          defaults: {
            duration: 0.35,
            ease: "power2.out"
          },
          onStart: () => {
            gsap.set(dropdownBackground, {
              pointerEvents: "auto"
            });
          },
          onReverseComplete: () => {
            gsap.set(dropdownBackground, {
              pointerEvents: "none"
            });
          }
        });

        backgroundTimeline.to(dropdownBackground, {
          autoAlpha: 1,
          yPercent: 0
        });
      }
    }

    // Mobile-only setup, scoped with gsap.matchMedia() so it ONLY applies
    // at 991px and below. When the viewport crosses back to desktop, GSAP
    // automatically reverts any inline styles set inside this context
    // (autoAlpha, yPercent, pointerEvents on navMenu), so data-nav-menu
    // returns to its normal CSS-driven desktop display instead of staying
    // hidden. Desktop dropdown logic above is untouched.
    function setupMobileMenu() {
      if (!navMenu) return;

      mobileMM.add("(max-width: 991px)", () => {
        gsap.set(navMenu, {
          autoAlpha: 0,
          xPercent: -5,
          pointerEvents: "none"
        });
        navMenu.setAttribute("aria-hidden", "true");
        setPanelFocusability(navMenu, false);

        mobileMenuTimeline = gsap.timeline({
          paused: true,
          defaults: {
            duration: 0.35,
            ease: "power2.out"
          },
          onStart: () => {
            gsap.set(navMenu, {
              pointerEvents: "auto"
            });
            navMenu.setAttribute("aria-hidden", "false");
            setPanelFocusability(navMenu, true);
          },
          onReverseComplete: () => {
            gsap.set(navMenu, {
              pointerEvents: "none"
            });
            navMenu.setAttribute("aria-hidden", "true");
            setPanelFocusability(navMenu, false);
          }
        });

        mobileMenuTimeline.to(navMenu, {
          autoAlpha: 1,
          xPercent: 0
        });

        isMobileContextActive = true;

        if (mobileMenuBackground) {
          gsap.set(mobileMenuBackground, {
            autoAlpha: 0,
            xPercent: -5,
            pointerEvents: "none"
          });

          mobileMenuBackgroundTimeline = gsap.timeline({
            paused: true,
            defaults: {
              duration: 0.35,
              ease: "power2.out"
            },
            onStart: () => {
              gsap.set(mobileMenuBackground, {
                pointerEvents: "auto"
              });
            },
            onReverseComplete: () => {
              gsap.set(mobileMenuBackground, {
                pointerEvents: "none"
              });
            }
          });

          mobileMenuBackgroundTimeline.to(mobileMenuBackground, {
            autoAlpha: 1,
            xPercent: 0
          });
        }

        // Mobile submenu panels fade in from the right (xPercent) instead
        // of the vertical yPercent slide desktop's hover-dropdowns use.
        // These are separate timelines from panelTimelines/desktop's, built
        // fresh inside this matchMedia context so GSAP auto-reverts the
        // xPercent/yPercent overrides on resize back to desktop, leaving
        // the original vertical desktop animation completely untouched.
        mobilePanelTimelines.clear();

        panels.forEach((panel) => {
          const name = panel.getAttribute("data-dropdown-content");

          gsap.set(panel, {
            position: "absolute",
            autoAlpha: 0,
            yPercent: 0,
            xPercent: -5,
            pointerEvents: "none"
          });
          panel.setAttribute("aria-hidden", "true");
          setPanelFocusability(panel, false);

          const mobilePanelTimeline = gsap.timeline({
            paused: true,
            defaults: {
              duration: 0.35,
              ease: "power2.out"
            },
            onStart: () => {
              panel.setAttribute("aria-hidden", "false");
              setPanelFocusability(panel, true);

              gsap.set(panel, {
                position: "relative",
                pointerEvents: "auto"
              });
            },
            onReverseComplete: () => {
              panel.setAttribute("aria-hidden", "true");
              setPanelFocusability(panel, false);

              gsap.set(panel, {
                position: "absolute",
                pointerEvents: "none"
              });
            }
          });

          mobilePanelTimeline.to(panel, {
            autoAlpha: 1,
            xPercent: 0
          });

          mobilePanelTimelines.set(name, mobilePanelTimeline);
        });

        // Cleanup runs automatically when the query stops matching
        // (i.e. resizing up to desktop), reverting the gsap.set/timeline
        // styles above and resetting mobile menu state.
        return () => {
          mobileMenuTimeline = null;
          mobileMenuBackgroundTimeline = null;
          isMobileMenuOpen = false;
          isMobileContextActive = false;
          mobilePanelTimelines.clear();

          if (activeMobileSubmenu) {
            closePanel(activeMobileSubmenu, {
              animateBackground: false,
              immediate: true
            });
            activeMobileSubmenu = null;
          }

          if (mobileMenuToggle) {
            mobileMenuToggle.setAttribute("aria-expanded", "false");
          }
        };
      });
    }

    function openBackground() {
      if (!backgroundTimeline) return;
      backgroundTimeline.play();
    }

    function closeBackground() {
      if (!backgroundTimeline) return;
      backgroundTimeline.reverse();
    }

    function openMobileMenu() {
      if (!isMobileContextActive) return;

      mobileMenuTimeline.play(0);

      if (mobileMenuBackgroundTimeline) {
        mobileMenuBackgroundTimeline.play();
      }

      if (mobileMenuToggle) {
        mobileMenuToggle.setAttribute("aria-expanded", "true");
      }

      isMobileMenuOpen = true;
    }

    function closeMobileMenu(immediate = false) {
      if (!isMobileContextActive) return;

      if (immediate) {
        mobileMenuTimeline.pause(0);

        gsap.set(navMenu, {
          autoAlpha: 0,
          xPercent: -5,
          pointerEvents: "none"
        });
        navMenu.setAttribute("aria-hidden", "true");
        setPanelFocusability(navMenu, false);

        if (mobileMenuBackgroundTimeline) {
          mobileMenuBackgroundTimeline.pause(0);
          gsap.set(mobileMenuBackground, {
            autoAlpha: 0,
            xPercent: -5,
            pointerEvents: "none"
          });
        }
      } else {
        mobileMenuTimeline.reverse();

        if (mobileMenuBackgroundTimeline) {
          mobileMenuBackgroundTimeline.reverse();
        }
      }

      if (mobileMenuToggle) {
        mobileMenuToggle.setAttribute("aria-expanded", "false");
      }

      isMobileMenuOpen = false;
    }

    // Reverses whichever submenu panel is currently drilled into, without
    // touching navMenu. immediate=true snaps it closed instantly (used
    // when a submenu is being replaced or the back button is pressed, so
    // it doesn't overlap with navMenu fading back in); immediate=false
    // animates the reverse (used when the whole menu closes from within
    // an open submenu, per the panel's own close button).
    function closeActiveMobileSubmenuPanel(immediate = false) {
      if (!activeMobileSubmenu) return;

      const name = activeMobileSubmenu;
      const panel = getPanelByName(name);
      const timeline = mobilePanelTimelines.get(name);

      if (timeline) {
        if (immediate) {
          timeline.pause(0);
        } else {
          timeline.reverse();
        }
      }

      if (immediate && panel) {
        panel.setAttribute("aria-hidden", "true");
        setPanelFocusability(panel, false);

        gsap.set(panel, {
          position: "absolute",
          autoAlpha: 0,
          xPercent: -5,
          pointerEvents: "none"
        });
      }

      activeMobileSubmenu = null;
    }

    // Drill-in: navMenu disappears immediately (no animation, so it never
    // overlaps the incoming panel), and the matching panel fades in from
    // the right on its own mobile-only timeline.
    function openMobileSubmenu(name) {
      if (!mobileMQ.matches) return;
      if (!isMobileContextActive || !isMobileMenuOpen) return;
      if (activeMobileSubmenu === name) return;

      const timeline = mobilePanelTimelines.get(name);
      if (!timeline) return;

      closeActiveMobileSubmenuPanel(true);

      mobileMenuTimeline.pause(0);
      gsap.set(navMenu, {
        autoAlpha: 0,
        pointerEvents: "none"
      });
      navMenu.setAttribute("aria-hidden", "true");
      setPanelFocusability(navMenu, false);

      timeline.play();
      activeMobileSubmenu = name;
    }

    // Back button: the open panel disappears immediately, and navMenu
    // fades back in the same way it originally opened, using the same
    // timeline.
    function closeMobileSubmenu() {
      if (!activeMobileSubmenu) return;

      closeActiveMobileSubmenuPanel(true);

      mobileMenuTimeline.play(0);
    }

    function toggleMobileMenu() {
      if (!mobileMQ.matches) return;
      if (!isMobileContextActive) return;

      if (isMobileMenuOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    }

    function closeMobileMenuAndPanels() {
      if (isMobileMenuOpen) {
        closeMobileMenu();
      }

      // Animated reverse here (not immediate) - this is the panel's own
      // close button, reversing "its original animation" per spec, while
      // navMenu (already hidden while a submenu is open) needs no change.
      closeActiveMobileSubmenuPanel(false);

      if (activeDropdown) {
        closeAllPanels();
      }
    }

    function openPanel(name) {
      const toggle = getToggleByName(name);
      const panel = getPanelByName(name);
      const timeline = panelTimelines.get(name);

      if (!toggle || !panel || !timeline) return;

      closeAllPanels({
        exceptName: name,
        animateBackground: false,
        immediate: true
      });

      openBackground();

      toggle.setAttribute("aria-expanded", "true");

      setPanelOpen(panel);
      rotateIconOpen(name);
      setToggleActive(name);

      timeline.play();

      activeDropdown = name;
    }

    function closePanel(name, options = {}) {
      const {
        animateBackground = true,
          immediate = false
      } = options;

      const toggle = getToggleByName(name);
      const panel = getPanelByName(name);
      const timeline = panelTimelines.get(name);

      if (!toggle || !panel || !timeline) return;

      toggle.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
      setPanelFocusability(panel, false);

      rotateIconClosed(name, immediate);
      setToggleInactive(name, immediate);

      if (immediate) {
        timeline.pause(0);
        setPanelClosed(panel);
      } else {
        timeline.reverse();
      }

      if (activeDropdown === name) {
        activeDropdown = null;
      }

      if (animateBackground && !activeDropdown) {
        closeBackground();
      }
    }

    function closeAllPanels(options = {}) {
      const {
        exceptName = null,
          animateBackground = true,
          immediate = false
      } = options;

      panelTimelines.forEach((timeline, name) => {
        if (name === exceptName) return;

        closePanel(name, {
          animateBackground: false,
          immediate
        });
      });

      if (!exceptName) {
        activeDropdown = null;
      }

      if (animateBackground && !activeDropdown) {
        closeBackground();
      }
    }

    function togglePanel(name) {
      if (!desktopMQ.matches) return;

      const isActive = activeDropdown === name;

      if (isActive) {
        closePanel(name);
      } else {
        openPanel(name);
      }
    }

    setupAccessibility();
    setupAnimations();
    setupMobileMenu();

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const name = toggle.getAttribute("data-dropdown-toggle");
        togglePanel(name);
        openMobileSubmenu(name);
      });

      toggle.addEventListener("keydown", (event) => {
        const name = toggle.getAttribute("data-dropdown-toggle");

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          togglePanel(name);
          openMobileSubmenu(name);
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();

          if (mobileMQ.matches && activeMobileSubmenu === name) {
            closeMobileSubmenu();
          }

          closeAllPanels();
          focusToggle(name);
          return;
        }

        if (event.key === "Tab" && !event.shiftKey && activeDropdown === name) {
          const focusedDropdownItem = focusFirstDropdownItem(name);

          if (focusedDropdownItem) {
            event.preventDefault();
          }

          return;
        }

        if (event.key === "Tab" && event.shiftKey && activeDropdown === name) {
          closePanel(name);
        }
      });
    });

    if (mobileMenuToggle) {
      mobileMenuToggle.setAttribute("aria-expanded", "false");

      mobileMenuToggle.addEventListener("click", () => {
        toggleMobileMenu();
      });
    }

    mobileMenuCloseButtons.forEach((closeButton) => {
      closeButton.addEventListener("click", () => {
        closeMobileMenuAndPanels();
      });
    });

    mobileDropdownBackButtons.forEach((backButton) => {
      backButton.addEventListener("click", () => {
        closeMobileSubmenu();
      });
    });

    if (navMenu) {
      navMenu.addEventListener("keydown", (event) => {
        if (!mobileMQ.matches) return;
        if (!isMobileMenuOpen) return;

        if (event.key === "Escape") {
          event.preventDefault();

          closeMobileMenuAndPanels();

          if (mobileMenuToggle) {
            mobileMenuToggle.focus();
          }

          return;
        }

        if (event.key !== "Tab") return;

        const focusableElements = getFocusableElements(navMenu);
        if (!focusableElements.length) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
          return;
        }

        if (!event.shiftKey && document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      });
    }

    panels.forEach((panel) => {
      const name = panel.getAttribute("data-dropdown-content");

      panel.addEventListener("keydown", (event) => {
        if (!desktopMQ.matches) return;
        if (activeDropdown !== name) return;

        const focusableElements = getFocusableElements(panel);

        if (event.key === "Escape") {
          event.preventDefault();

          closePanel(name);
          focusToggle(name);
          return;
        }

        if (event.key !== "Tab") return;
        if (!focusableElements.length) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstFocusable) {
          event.preventDefault();

          focusToggle(name);
          return;
        }

        if (!event.shiftKey && document.activeElement === lastFocusable) {
          const nextToggle = getNextToggle(name);

          closePanel(name);

          if (nextToggle) {
            event.preventDefault();
            nextToggle.focus();
          }
        }
      });

      // Mobile drill-in: the panel is now the only visible surface (navMenu
      // is faded out), so Tab wraps within the panel itself rather than
      // moving on to the next toggle, and Escape goes back to the list
      // instead of closing the whole menu.
      panel.addEventListener("keydown", (event) => {
        if (!mobileMQ.matches) return;
        if (activeMobileSubmenu !== name) return;

        if (event.key === "Escape") {
          event.preventDefault();

          closeMobileSubmenu();
          focusToggle(name);
          return;
        }

        if (event.key !== "Tab") return;

        const focusableElements = getFocusableElements(panel);
        if (!focusableElements.length) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
          return;
        }

        if (!event.shiftKey && document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      });
    });

    nav.addEventListener("focusout", (event) => {
      if (!desktopMQ.matches) return;
      if (!activeDropdown) return;

      const nextFocusedElement = event.relatedTarget;

      if (nextFocusedElement && nav.contains(nextFocusedElement)) return;

      window.setTimeout(() => {
        if (nav.contains(document.activeElement)) return;

        closeAllPanels();
      }, 0);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!activeDropdown) return;

      const activeToggle = getToggleByName(activeDropdown);

      closeAllPanels();

      if (activeToggle) {
        activeToggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (!desktopMQ.matches) return;
      if (!activeDropdown) return;
      if (nav.contains(event.target)) return;

      closeAllPanels();
    });

    desktopMQ.addEventListener("change", () => {
      closeAllPanels({
        immediate: true
      });
    });
  });
}

initNavbar();
